/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

class Distribute {

  constructor(hamsters) {
    'use strict';

    this.hamsters = hamsters;
    this.localConnection = null;
    this.remoteConnections = new hamsters.observable({});
    this.clientInfo = new hamsters.observable({});
    this.sendChannels = new hamsters.observable({});
    this.receiveChannels = new hamsters.observable({});
    this.pcConstraint = null;
    this.dataConstraint = null;
    this.ws = null;
    this.clientId = null;
    this.pendingPromises = new hamsters.observable({});
    this.returnDistributedOutput = this.sendDataResponse.bind(this);
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
    const newClientIds = new Set(clients.map(client => client.id));
    clients.forEach(client => {
        if (client.id !== this.clientId && !this.remoteConnections.get(client.id)) {
            this.createConnection(client.id);
        }
    });
    const remoteConnections = this.remoteConnections.getData();
    Object.keys(remoteConnections).forEach((key) => {
        if (!newClientIds.has(key)) {
          this.handleClientDisconnect(key);
        }
    });
  }

  handleClientDisconnect(clientId) {
    if (this.remoteConnections.get(clientId)) {
      this.remoteConnections.get(clientId).close();
      this.remoteConnections.delete(clientId);
    }
    if (this.sendChannels.get(clientId)) {
      this.sendChannels.get(clientId).close();
      this.sendChannels.delete(clientId);
    }
    if (this.receiveChannels.get(clientId)) {
      this.receiveChannels.get(clientId).close();
      this.receiveChannels.delete(clientId);
    }
    this.clientInfo.delete(clientId);
  };

  handleClientReconnect(message) {
    const newClientId = message.id;

    if (this.clientId === newClientId) {
      if (this.hamsters.habitat.debug) {
        console.log(`Hamsters.js ${this.hamsters.version} connection error: `, error);
      }
      return;
    }
    this.handleClientDisconnect(newClientId);
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
    this.remoteConnections.forEach((_, targetClient) => {
      this.createConnection(targetClient);
    });
  }

  createConnection(targetClient) {
    if (targetClient === this.clientId || this.remoteConnections.get(targetClient)) {
      return;
    }

    const servers = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    const localConnection = new RTCPeerConnection(servers, this.pcConstraint);
    const sendChannel = localConnection.createDataChannel('hamstersjs', this.dataConstraint);

    localConnection.onicecandidate = (e) => {
      if (e.candidate) {
        this.ws.send(JSON.stringify({ 
          type: 'candidate', 
          target: targetClient, 
          from: this.clientId,
          logicalCores: this.hamsters.maxThreads,
          userAgent: navigator.userAgent,
          candidate: e.candidate
        }));
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

    this.remoteConnections.set(targetClient, localConnection);
    this.sendChannels.set(targetClient, sendChannel);
    this.receiveChannels.set(targetClient, null);

    localConnection.createOffer().then(desc => {
      localConnection.setLocalDescription(desc);
      this.ws.send(JSON.stringify({ type: 'offer', target: targetClient, offer: desc }));
    }).catch(this.onCreateSessionDescriptionError);
  }

  handleOffer(data) {
    const targetClient = data.from;

    if (!this.remoteConnections.get(targetClient)) {
      const servers = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      };

      const remoteConnection = new RTCPeerConnection(servers, this.pcConstraint);

      remoteConnection.onicecandidate = (e) => {
        if (e.candidate) {
          this.ws.send(JSON.stringify({ type: 'candidate', target: targetClient, logicalCores: this.hamsters.maxThreads, userAgent: navigator.userAgent, candidate: e.candidate }));
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
        this.ws.send(JSON.stringify({ type: 'answer', target: targetClient, logicalCores: this.hamsters.maxThreads, userAgent: navigator.userAgent, answer: desc }));
      }).catch(this.onCreateSessionDescriptionError);

      this.remoteConnections.set(targetClient, remoteConnection);
      this.sendChannels.set(targetClient, sendChannel);
    }
  }

  storeClientConnectionInfo(data) {
    const client = {
      logicalCores: data.logicalCores,
      userAgent: data.userAgent,
    };
    this.clientInfo.set(data.from, client);
  }

  handleAnswer(data) {
    this.storeClientConnectionInfo(data);
    const connection = this.remoteConnections.get(data.from);
    connection.setRemoteDescription(new RTCSessionDescription(data.answer));
  }

  handleCandidate(data) {
    this.storeClientConnectionInfo(data);
    const connection = this.remoteConnections.get(data.from);
    connection.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(this.onAddIceCandidateError);
  }

  measureLatency(targetClient) {
    const startTime = performance.now();
    this.sendPing(targetClient, startTime);
  }

  sendPing(targetClient, startTime) {
    const sendChannel = this.sendChannels.get(targetClient);
    if (sendChannel && sendChannel.readyState === 'open') {
      sendChannel.send(JSON.stringify({ type: 'ping', startTime }));
    }
  }

  handlePing(targetClient, startTime) {
    const sendChannel = this.receiveChannels.get(targetClient);
    if (sendChannel && sendChannel.readyState === 'open') {
      sendChannel.send(JSON.stringify({ type: 'pong', startTime }));
      if (this.hamsters.habitat.debug) {
        console.log(`Hamsters.js ${this.hamsters.version} sent ping to ${targetClient}`);
      }
    }
  }

  handlePong(targetClient, startTime) {
    const latency = performance.now() - startTime;
    this.clientInfo.set(targetClient, { ...this.clientInfo.get(targetClient), latency });
    if (this.hamsters.habitat.debug) {
      console.log(`Hamsters.js ${this.hamsters.version} received pong from ${targetClient} with latency: ${latency.toFixed(2)}ms`);
    }
  }

  fetchDistributedClient() {
    const sendChannelKeys = Array.from(this.sendChannels.keys());
    if (sendChannelKeys.length === 0) {
      if (this.hamsters.habitat.debug) {
        console.warn(`Hamsters.js ${this.hamsters.version} no send channels available.`);
      }
      return null;
    }

    let minLatency = Infinity;
    let targetClient = null;

    sendChannelKeys.forEach(clientId => {
      const channel = this.sendChannels.get(clientId);
      const client = this.clientInfo.get(clientId);
      if (channel.readyState === 'open' && client.latency < minLatency) {
        minLatency = client.latency;
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

    this.pendingPromises.set(messageId, { resolve, reject });

    this.sendData({ targetClient, data: subTask });
  }

  handleTaskResponse(incomingMessage) {
    const { messageId, output, error } = incomingMessage;
    const pendingPromise = this.pendingPromises.get(messageId);

    if (pendingPromise) {
      if (error) {
        pendingPromise.reject(error);
      } else {
        pendingPromise.resolve(output);
      }

      this.pendingPromises.delete(messageId);
    }
  }

  sendData({ targetClient, data }) {
    const sendChannel = this.sendChannels.get(targetClient);
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
    const sendChannel = this.receiveChannels.get(targetClient);
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
    for (const targetClient of this.sendChannels.keys()) {
      const sendChannel = this.sendChannels.get(targetClient);
      if (sendChannel) {
        sendChannel.close();
        this.sendChannels.delete(targetClient);
      }
      const receiveChannel = this.receiveChannels.get(targetClient);
      if (receiveChannel) {
        receiveChannel.close();
        this.receiveChannels.delete(targetClient);
      }
      const remoteConnection = this.remoteConnections.get(targetClient);
      if (remoteConnection) {
        remoteConnection.close();
        this.remoteConnections.delete(targetClient);
      }
      this.clientInfo.delete(targetClient);
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

    this.receiveChannels.set(targetClient, receiveChannel);
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
    const sendChannel = this.sendChannels.get(targetClient);
    this.measureLatency(targetClient);
    if (sendChannel && this.hamsters.habitat.debug) {
      console.log(`Hamsters.js ${this.hamsters.version} send channel state changed for ${targetClient}: ${sendChannel.readyState}`);
    }
  }

  onReceiveChannelStateChange(targetClient) {
    const receiveChannel = this.receiveChannels.get(targetClient);
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

export default Distribute;
