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
    this.connectionTargets = []; // New property to hold the connection targets
    this.clientId = null; // New property to store the client's own ID

    // Initialize elements
    this.dataChannelSend = document.getElementById('dataChannelSend');
    this.clientSelect = document.getElementById('clientSelect');

    this.initWebSocket();

    // Add event listener for connect button
    document.getElementById('connectButton').addEventListener('click', () => {
      this.createConnection();
    });
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
    this.displayClientList(); // Method to update the UI
  }

  displayClientList() {
    // Ensure that this method clears the list before updating to avoid duplicates
    this.clientSelect.innerHTML = '';
    this.connectionTargets.forEach(clientId => {
      const option = document.createElement('option');
      option.value = clientId;
      option.text = clientId;
      this.clientSelect.appendChild(option);
    });
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

    this.dataChannelSend.placeholder = '';
    const servers = null;

    this.connectionTargets.forEach(targetClient => {
      const localConnection = new RTCPeerConnection(servers, this.pcConstraint);
      const sendChannel = localConnection.createDataChannel('hamstersjs', this.dataConstraint);

      localConnection.onicecandidate = (e) => {
        if (e.candidate) {
          this.ws.send(JSON.stringify({ type: 'candidate', target: targetClient, candidate: e.candidate }));
        }
      };

      sendChannel.onopen = () => {
        this.onSendChannelStateChange();
        this.sendData({ targetClient, data: 'Initial connection established' }); // Send initial data
      };
      sendChannel.onclose = this.onSendChannelStateChange.bind(this);

      // Store connections and channels
      this.remoteConnections[targetClient] = localConnection;
      this.sendChannels[targetClient] = sendChannel;

      localConnection.createOffer().then(desc => {
        localConnection.setLocalDescription(desc);
        this.ws.send(JSON.stringify({ type: 'offer', target: targetClient, offer: desc }));
      }).catch(this.onCreateSessionDescriptionError);
    });
  }

  handleOffer(data) {
    const targetClient = data.from;
    const remoteConnection = new RTCPeerConnection(null, this.pcConstraint);

    remoteConnection.onicecandidate = (e) => {
      if (e.candidate) {
        this.ws.send(JSON.stringify({ type: 'candidate', target: targetClient, candidate: e.candidate }));
      }
    };
    remoteConnection.ondatachannel = this.receiveChannelCallback.bind(this);

    remoteConnection.setRemoteDescription(new RTCSessionDescription(data.offer)).then(() => {
      return remoteConnection.createAnswer();
    }).then(desc => {
      remoteConnection.setLocalDescription(desc);
      this.ws.send(JSON.stringify({ type: 'answer', target: targetClient, answer: desc }));
    }).catch(this.onCreateSessionDescriptionError);

    // Store the remote connection
    this.remoteConnections[targetClient] = remoteConnection;
  }

  handleAnswer(data) {
    const connection = this.remoteConnections[data.from];
    connection.setRemoteDescription(new RTCSessionDescription(data.answer));
  }

  handleCandidate(data) {
    const connection = this.remoteConnections[data.from];
    connection.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(this.onAddIceCandidateError);
  }

  sendData(data) {
    const { targetClient, data: payload } = data;
    const sendChannel = this.sendChannels[targetClient];
    
    if (sendChannel.readyState === 'open') {
      sendChannel.send(JSON.stringify(payload));
      this.trace('Sent Data to ' + targetClient + ': ' + payload);
    } else {
      sendChannel.onopen = () => {
        sendChannel.send(JSON.stringify(payload));
        this.trace('Sent Data to ' + targetClient + ': ' + payload);
      };
    }
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

  receiveChannelCallback(event) {
    const receiveChannel = event.channel;
    receiveChannel.onmessage = this.onReceiveMessageCallback.bind(this);
    receiveChannel.onopen = this.onReceiveChannelStateChange.bind(this);
    receiveChannel.onclose = this.onReceiveChannelStateChange.bind(this);

    // Store the receive channel
    this.receiveChannels[event.targetClient] = receiveChannel;
  }

  onReceiveMessageCallback(event) {
    console.log(event.data);
  }

  onSendChannelStateChange() {
    // Handle send channel state change if needed
  }

  onReceiveChannelStateChange() {
    // Handle receive channel state change if needed
  }

  trace(arg) {
    const now = (window.performance.now() / 1000).toFixed(3);
    console.log(now + ': ', arg);
  }

  onCreateSessionDescriptionError(error) {
    this.trace('Failed to create session description: ' + error.toString());
  }

  onAddIceCandidateError(error) {
    this.trace('Failed to add Ice Candidate: ' + error.toString());
  }
}

module.exports = Distribute;
