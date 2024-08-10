class Distribute {

  constructor(hamsters) {
    'use strict';

    this.hamsters = hamsters;
    this.localConnection = null;
    this.remoteConnections = {};
    this.sendChannels = {};
    this.receiveChannels = {};
    this.pcConstraint = null;
    this.dataConstraint = null;
    this.ws = null;
    this.clientId = null;
    this.pendingPromises = {};
    this.returnDistributedOutput = this.sendDataResponse.bind(this);
    this.latencies = {};
    this.establishConnection = this.initWebSocket.bind(this);
  }

  initWebSocket() {
    this.ws = new WebSocket(`${this.hamsters.habitat.relay}`);

    this.ws.onopen = () => {
      console.info(`Hamsters.js ${this.hamsters.version} connection established`);
      const registerMessage = {
        type: 'register',
        logicalCores: this.hamsters.maxThreads
      };
      this.ws.send(JSON.stringify(registerMessage));
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case 'register':
          this.handleClientReconnect(message);
          break;
        case 'update-client-list':
          this.updateClientList(message.clients);
          break;
        case 'offer':
          this.handleOffer(message);
          break;
        case 'answer':
          this.handleAnswer(message);
          break;
        case 'candidate':
          this.handleCandidate(message);
          break;
        case 'task-response':
          this.handleTaskResponse(message);
          break;
        default:
          if (this.hamsters.habitat.debug) {
            console.info(`Hamsters.js ${this.hamsters.version} unknown message type: ${message.type}`);
          }
      }
    };

    this.ws.onerror = (error) => {
      if (this.hamsters.habitat.debug) {
        console.error(`Hamsters.js ${this.hamsters.version} connection error: ${error}`);
      }
    };

    this.ws.onclose = () => {
      if (this.hamsters.habitat.debug) {
        console.info(`Hamsters.js ${this.hamsters.version} connection closed.`);
      }
    };
  }

  updateClientList(clients) {
    clients.forEach(client => {
      if (client.id !== this.clientId && !this.remoteConnections[client.id]) {
        this.createConnection(client.id);
      }
    });
  }

  handleClientReconnect(message) {
    const newClientId = message.id;

    if (this.clientId === newClientId) {
      if (this.hamsters.habitat.debug) {
        console.log(`Hamsters.js ${this.hamsters.version} connection error: `, error);
      }
      return;
    }

    if (this.remoteConnections[newClientId]) {
      this.remoteConnections[newClientId].close();
      delete this.remoteConnections[newClientId];
    }
    if (this.sendChannels[newClientId]) {
      this.sendChannels[newClientId].close();
      delete this.sendChannels[newClientId];
    }
    if (this.receiveChannels[newClientId]) {
      this.receiveChannels[newClientId].close();
      delete this.receiveChannels[newClientId];
    }
    delete this.latencies[newClientId];

    this.clientId = newClientId;
    this.loadClientList();
  }

  loadClientList() {
    fetch(`/clients?currentId=${this.clientId}`)
      .then(response => response.json())
      .then(data => {
        this.updateClientList(data);
      })
      .catch(error => {
        if (this.hamsters.habitat.debug) {
          console.error(`Hamsters.js ${this.hamsters.version} Error fetching client list: ${error}`);
        }
      });
  }

  createConnections() {
    Object.keys(this.remoteConnections).forEach(targetClient => {
      this.createConnection(targetClient);
    });
  }

  createConnection(targetClient) {
    if (targetClient === this.clientId || this.remoteConnections[targetClient]) {
      return;
    }

    const servers = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    const localConnection = new RTCPeerConnection(servers, this.pcConstraint);
    const sendChannel = localConnection.createDataChannel('hamstersjs', this.dataConstraint);

    localConnection.onicecandidate = (e) => {
      if (e.candidate) {
        this.ws.send(JSON.stringify({ type: 'candidate', target: targetClient, candidate: e.candidate }));
      }
    };

    sendChannel.onopen = () => {
      this.onSendChannelStateChange(targetClient);
    };

    sendChannel.onclose = () => {
      this.onSendChannelStateChange(targetClient);
    };

    sendChannel.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case 'ping':
          this.handlePing(targetClient, message.startTime);
          break;
        case 'pong':
          this.handlePong(targetClient, message.startTime);
          break;
        default:
          this.onReceiveMessageCallback(targetClient, event.data);
      }
    };

    localConnection.ondatachannel = (event) => {
      this.receiveChannelCallback(event, targetClient);
    };

    this.remoteConnections[targetClient] = localConnection;
    this.sendChannels[targetClient] = sendChannel;
    this.receiveChannels[targetClient] = null;

    localConnection.createOffer().then(desc => {
      localConnection.setLocalDescription(desc);
      this.ws.send(JSON.stringify({ type: 'offer', target: targetClient, offer: desc }));
    }).catch(this.onCreateSessionDescriptionError);
  }

  handleOffer(data) {
    const targetClient = data.from;

    if (!this.remoteConnections[targetClient]) {
      const servers = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      };

      const remoteConnection = new RTCPeerConnection(servers, this.pcConstraint);

      remoteConnection.onicecandidate = (e) => {
        if (e.candidate) {
          this.ws.send(JSON.stringify({ type: 'candidate', target: targetClient, candidate: e.candidate }));
        }
      };

      remoteConnection.ondatachannel = (event) => {
        this.receiveChannelCallback(event, targetClient);
      };

      const sendChannel = remoteConnection.createDataChannel('hamstersjs', this.dataConstraint);
      
      sendChannel.onopen = () => {
        this.onSendChannelStateChange(targetClient);
      };

      sendChannel.onclose = () => {
        this.onSendChannelStateChange(targetClient);
      };

      sendChannel.onmessage = (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'ping':
            this.handlePing(targetClient, message.startTime);
            break;
          case 'pong':
            this.handlePong(targetClient, message.startTime);
            break;
          default:
            this.onReceiveMessageCallback(targetClient, event.data);
        }
      };

      remoteConnection.setRemoteDescription(new RTCSessionDescription(data.offer)).then(() => {
        return remoteConnection.createAnswer();
      }).then(desc => {
        remoteConnection.setLocalDescription(desc);
        this.ws.send(JSON.stringify({ type: 'answer', target: targetClient, answer: desc }));
      }).catch(this.onCreateSessionDescriptionError);

      this.remoteConnections[targetClient] = remoteConnection;
      this.sendChannels[targetClient] = sendChannel;
    }
  }

  handleAnswer(data) {
    const connection = this.remoteConnections[data.from];
    connection.setRemoteDescription(new RTCSessionDescription(data.answer));
  }

  handleCandidate(data) {
    const connection = this.remoteConnections[data.from];
    connection.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(this.onAddIceCandidateError);
  }

  measureLatency(targetClient) {
    const startTime = performance.now();
    this.sendPing(targetClient, startTime);
  }

  sendPing(targetClient, startTime) {
    const sendChannel = this.sendChannels[targetClient];
    if (sendChannel && sendChannel.readyState === 'open') {
      sendChannel.send(JSON.stringify({ type: 'ping', startTime }));
    }
  }

  handlePing(targetClient, startTime) {
    console.log("Remote Connections ", this.remoteConnections);
    const sendChannel = this.receiveChannels[targetClient];
    if (sendChannel && sendChannel.readyState === 'open') {
      sendChannel.send(JSON.stringify({ type: 'pong', startTime }));
      if (this.hamsters.habitat.debug) {
        console.log(`Hamsters.js ${this.hamsters.version} sent ping to ${targetClient}`);
      }
    }
  }

  handlePong(targetClient, startTime) {
    const latency = performance.now() - startTime;
    this.latencies[targetClient] = latency;
    if (this.hamsters.habitat.debug) {
      console.log(`Hamsters.js ${this.hamsters.version} received pong from ${targetClient} with latency: ${latency.toFixed(2)}ms`);
    }
  }

  fetchDistributedClient() {
    const sendChannelKeys = Object.keys(this.sendChannels);
    if (sendChannelKeys.length === 0) {
      if (this.hamsters.habitat.debug) {
        console.warn(`Hamsters.js ${this.hamsters.version} no send channels available.`);
      }
      return null;
    }

    let minLatency = Infinity;
    let targetClient = null;

    sendChannelKeys.forEach(clientId => {
      let channel = this.sendChannels[clientId];
      if (channel.readyState === 'open' && this.latencies[clientId] < minLatency) {
        minLatency = this.latencies[clientId];
        targetClient = clientId;
      }
    });

    return targetClient;
  }

  distributeTask(task, hamsterFood, resolve, reject) {
    const targetClient = this.fetchDistributedClient();
    if (!targetClient) {
      if (this.hamsters.habitat.debug) {
        console.error(`Hamsters.js ${this.hamsters.version} no target client found.`);
      }
      reject('No target client found.');
      return;
    }

    const messageId = this.generateUniqueId();

    const subTask = {
      hamsterFood,
      index: hamsterFood.index,
      task,
      messageId,
    };

    this.pendingPromises[messageId] = { resolve, reject };

    this.sendData({ targetClient, data: subTask });
  }

  handleTaskResponse(incomingMessage) {
    const { messageId, output, error } = incomingMessage;
    const pendingPromise = this.pendingPromises[messageId];

    if (pendingPromise) {
      if (error) {
        pendingPromise.reject(error);
      } else {
        pendingPromise.resolve(output);
      }

      delete this.pendingPromises[messageId];
    }
  }

  sendData({ targetClient, data }) {
    const sendChannel = this.sendChannels[targetClient];
    if (sendChannel && sendChannel.readyState === 'open') {
      sendChannel.send(JSON.stringify(data));
      if (this.hamsters.habitat.debug) {
        console.log(`Hamsters.js ${this.hamsters.version} sent data to: `, targetClient);
      }
    } else {
      if (this.hamsters.habitat.debug) {
        console.error(`Hamsters.js ${this.hamsters.version} send channel is not open for targetClient: `, targetClient);
      }
    }
  }

  sendDataResponse(data) {
    const targetClient = data.targetClient;
    const sendChannel = this.receiveChannels[targetClient];
    if (sendChannel && sendChannel.readyState === 'open') {
      sendChannel.send(JSON.stringify(data));
      if (this.hamsters.habitat.debug) {
        console.log(`Hamsters.js ${this.hamsters.version} sent response to: `, targetClient);
      }
    } else {
      if (this.hamsters.habitat.debug) {
        console.error(`Hamsters.js ${this.hamsters.version} send channel is not open for targetClient: `, targetClient);
      }
    }
  }

  closeDataChannels() {
    for (const targetClient in this.sendChannels) {
      if (this.sendChannels[targetClient]) {
        this.sendChannels[targetClient].close();
        delete this.sendChannels[targetClient];
      }
      if (this.receiveChannels[targetClient]) {
        this.receiveChannels[targetClient].close();
        delete this.receiveChannels[targetClient];
      }
      if (this.remoteConnections[targetClient]) {
        this.remoteConnections[targetClient].close();
        delete this.remoteConnections[targetClient];
      }
      delete this.latencies[targetClient];
    }
    this.localConnection = null;
  }

  receiveChannelCallback(event, targetClient) {
    const receiveChannel = event.channel;

    receiveChannel.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case 'ping':
          this.handlePing(targetClient, message.startTime);
          break;
        case 'pong':
          this.handlePong(targetClient, message.startTime);
          break;
        default:
          this.onReceiveMessageCallback(targetClient, event.data);
      }
    };

    receiveChannel.onopen = () => {
      this.onReceiveChannelStateChange(targetClient);
    };

    receiveChannel.onclose = () => {
      this.onReceiveChannelStateChange(targetClient);
    };

    this.receiveChannels[targetClient] = receiveChannel;
  }

  onReceiveMessageCallback(targetClient, data) {
    if (this.hamsters.habitat.debug) {
      console.log(`Hamsters.js ${this.hamsters.version} received message!`);
    }
    const incomingMessage = JSON.parse(data);

    if (incomingMessage.isReply) {
      this.handleTaskResponse(incomingMessage);
      if (this.hamsters.habitat.debug) {
        console.log(`Hamsters.js ${this.hamsters.version} response received for task: `, incomingMessage);
      }
    } else {
      this.hamsters.pool.runDistributedTask(incomingMessage, targetClient);
    }
  }

  onSendChannelStateChange(targetClient) {
    const sendChannel = this.sendChannels[targetClient];
    this.measureLatency(targetClient);
    if (sendChannel && this.hamsters.habitat.debug) {
      console.log(`Hamsters.js ${this.hamsters.version} send channel state changed for ${targetClient}: ${sendChannel.readyState}`);
    }
  }

  onReceiveChannelStateChange(targetClient) {
    const receiveChannel = this.receiveChannels[targetClient];
    if (receiveChannel && this.hamsters.habitat.debug) {
      console.log(`Hamsters.js ${this.hamsters.version} receive channel state changed for ${targetClient}: ${receiveChannel.readyState}`);
    }
  }

  generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  onCreateSessionDescriptionError(error) {
    if (this.hamsters.habitat.debug) {
      console.error(`Hamsters.js ${this.hamsters.version} failed to create session description: ${error}`);
    }
  }

  onAddIceCandidateError(error) {
    if (this.hamsters.habitat.debug) {
      console.error(`Hamsters.js ${this.hamsters.version} failed to add ICE candidate: ${error}`);
    }
  }
}

module.exports = Distribute;