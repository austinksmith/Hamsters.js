class Distribute {
  constructor(hamsters) {
    'use strict';

    this.hamsters = hamsters;
    this.localConnection = null;
    this.remoteConnections = {};
    this.sendChannels = {};       // Stores outgoing data channels
    this.receiveChannels = {};    // Stores incoming data channels
    this.pcConstraint = null;
    this.dataConstraint = null;
    this.ws = null;
    this.connectionTargets = [];  // List of clients to connect to
    this.clientId = null;         // Current client ID
    this.pendingPromises = {};    // Store pending promises by messageId
    this.returnDistributedOutput = this.sendDataResponse.bind(this);

    // Initialize WebSocket connection
    this.initWebSocket();
  }

  initWebSocket() {
    this.ws = new WebSocket(`ws://${window.location.host}`);

    this.ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case 'register':
          this.clientId = message.id;
          this.loadClientList();
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
          console.log('Unknown message type:', message.type);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }

  updateClientList(clients) {
    this.connectionTargets = clients.map(client => client.id);
  }

  loadClientList() {
    fetch(`/clients?currentId=${this.clientId}`)
      .then(response => response.json())
      .then(data => {
        this.connectionTargets = data.map(client => client.id);
        this.createConnection(); // Automatically create connections after fetching client list
      })
      .catch(error => console.error('Error fetching client list:', error));
  }

  createConnection() {
    if (!this.connectionTargets.length) {
      return alert('No clients to connect to.');
    }

    const servers = null;

    this.connectionTargets.forEach(targetClient => {
      if (!this.remoteConnections[targetClient]) {
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
          this.onReceiveMessageCallback(targetClient, event.data);
        };

        // Store connections and channels
        this.remoteConnections[targetClient] = localConnection;
        this.sendChannels[targetClient] = sendChannel;

        localConnection.createOffer().then(desc => {
          localConnection.setLocalDescription(desc);
          this.ws.send(JSON.stringify({ type: 'offer', target: targetClient, offer: desc }));
        }).catch(this.onCreateSessionDescriptionError);
      }
    });
  }

  handleOffer(data) {
    const targetClient = data.from;

    if (!this.remoteConnections[targetClient]) {
      const remoteConnection = new RTCPeerConnection(null, this.pcConstraint);

      remoteConnection.onicecandidate = (e) => {
        if (e.candidate) {
          this.ws.send(JSON.stringify({ type: 'candidate', target: targetClient, candidate: e.candidate }));
        }
      };
      remoteConnection.ondatachannel = (event) => {
        this.receiveChannelCallback(event, targetClient); // Pass targetClient to associate with the channel
      };

      remoteConnection.setRemoteDescription(new RTCSessionDescription(data.offer)).then(() => {
        return remoteConnection.createAnswer();
      }).then(desc => {
        remoteConnection.setLocalDescription(desc);
        this.ws.send(JSON.stringify({ type: 'answer', target: targetClient, answer: desc }));
      }).catch(this.onCreateSessionDescriptionError);

      // Store the remote connection
      this.remoteConnections[targetClient] = remoteConnection;
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

  fetchDistributedClient() {
    const sendChannelKeys = Object.keys(this.sendChannels);
    if (sendChannelKeys.length === 0) {
      console.warn('No send channels available.');
      return null;
    }

    const randomIndex = Math.floor(Math.random() * sendChannelKeys.length);
    return sendChannelKeys[randomIndex];
  }

  distributeTask(task, hamsterFood) {
    return new Promise((resolve, reject) => {
      const targetClient = this.fetchDistributedClient();
      const messageId = this.generateUniqueId();

      const subTask = {
        hamsterFood,
        index: hamsterFood.index,
        task,
        messageId,
      };

      // Store the resolve and reject in a map with messageId
      this.pendingPromises[messageId] = { resolve, reject };

      this.sendData({ targetClient, data: subTask });
    });
  }

  sendData(data) {
    const { targetClient, data: payload } = data;
    let sendChannel = this.sendChannels[targetClient];

    // If sendChannel is not available in sendChannels, check receiveChannels
    if (!sendChannel) {
      sendChannel = this.receiveChannels[targetClient];
    }

    if (!sendChannel) {
      console.error('No send or receive channel found for targetClient:', targetClient);
      return;
    }

    if (sendChannel.readyState === 'open') {
      sendChannel.send(JSON.stringify(payload));
      this.trace('Sent Data to ' + targetClient + ': ' + JSON.stringify(payload));
    } else {
      sendChannel.onopen = () => {
        sendChannel.send(JSON.stringify(payload));
        this.trace('Sent Data to ' + targetClient + ': ' + JSON.stringify(payload));
      };
    }
  }

  handleTaskResponse(data) {
    const { messageId, output, error } = data;

    const { resolve, reject } = this.pendingPromises[messageId];

    if (error) {
      reject(error);
    } else {
      resolve(result);
    }

    delete this.pendingPromises[messageId];
  }

  closeDataChannels() {
    for (const targetClient in this.sendChannels) {
      this.sendChannels[targetClient].close();
      if (this.receiveChannels[targetClient]) this.receiveChannels[targetClient].close();
      this.remoteConnections[targetClient].close();
    }
    this.localConnection = null;
    this.remoteConnections = {};
    this.sendChannels = {};
    this.receiveChannels = {};
  }

  receiveChannelCallback(event, targetClient) {
    const receiveChannel = event.channel;
    receiveChannel.onmessage = (event) => {
      this.onReceiveMessageCallback(targetClient, event.data);
    };
    receiveChannel.onopen = () => {
      this.onReceiveChannelStateChange(targetClient);
    };
    receiveChannel.onclose = () => {
      this.onReceiveChannelStateChange(targetClient);
    };

    // Store the receive channel with targetClient ID
    this.receiveChannels[targetClient] = receiveChannel;

    // Ensure a send channel is created if it doesn't already exist
    if (!this.sendChannels[targetClient]) {
      const localConnection = this.remoteConnections[targetClient];
      const sendChannel = localConnection.createDataChannel('hamstersjs', this.dataConstraint);

      sendChannel.onopen = () => {
        this.onSendChannelStateChange(targetClient);
      };
      sendChannel.onclose = () => {
        this.onSendChannelStateChange(targetClient);
      };

      sendChannel.onmessage = (event) => {
        this.onReceiveMessageCallback(targetClient, event.data);
      };

      this.sendChannels[targetClient] = sendChannel;
    }
  }

  onReceiveMessageCallback(targetClient, data) {
    console.log('Received message!');
    const incomingMessage = JSON.parse(data);

    if (incomingMessage.isReply) {
      // This is a response from Client A to Client B
      this.handleTaskResponse(incomingMessage);
      console.log("Response received for task:", incomingMessage);
    } else {
      // Process the task on the current client (Client B) and send a response back
      this.hamsters.pool.runDistributedTask(incomingMessage, targetClient);
    }
  }

  sendDataResponse(data) {
    const targetClient = data.targetClient;
    const sendChannel = this.receiveChannels[targetClient];
    if (sendChannel && sendChannel.readyState === 'open') {
      sendChannel.send(JSON.stringify(data));
      console.log('Sent response to', targetClient);
    } else {
      console.error('Send channel is not open for targetClient:', targetClient);
    }
  }

  onSendChannelStateChange(targetClient) {
    const sendChannel = this.sendChannels[targetClient];
    const readyState = sendChannel ? sendChannel.readyState : 'unknown';
    console.log('Send channel state for', targetClient, 'is:', readyState);
  }

  onReceiveChannelStateChange(targetClient) {
    const receiveChannel = this.receiveChannels[targetClient];
    const readyState = receiveChannel ? receiveChannel.readyState : 'unknown';
    console.log('Receive channel state for', targetClient, 'is:', readyState);
  }

  generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  trace(text) {
    console.log((performance.now() / 1000).toFixed(3) + ': ' + text);
  }

  onCreateSessionDescriptionError(error) {
    console.error('Failed to create session description:', error.toString());
  }

  onAddIceCandidateError(error) {
    console.error('Failed to add ICE candidate:', error.toString());
  }
}

module.exports = Distribute;
