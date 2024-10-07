class Distribute {
  constructor(hamsters) {
    'use strict';

    this.hamsters = hamsters;
    this.localConnection = null;
    this.remoteConnections = new hamsters.observable({});
    this.clientInfo = new hamsters.observable({});
    this.sendChannels = new hamsters.observable({});
    this.pcConstraint = null;
    this.ws = null;
    this.clientId = null;
    this.pendingPromises = new hamsters.observable({});
    this.pendingTasks = new hamsters.observable({});
    this.pendingTransfers = new hamsters.observable({});
    this.awaitingTransfers = new hamsters.observable({});
    this.lastRequestedTransfers = new hamsters.observable({});
    this.pendingOutputs = new hamsters.observable({});
    this.returnDistributedOutput = this.sendDataResponse.bind(this);
    this.establishConnection = this.initWebSocket.bind(this);
    this.lastHeartbeat = {};
    this.heartBeatInterval = 30 * 1000; //Send heartbeat message every 30 seconds
    this.heartBeatTimeout = {};
  }

  initWebSocket() {
    this.ws = new WebSocket(`${this.hamsters.habitat.relay}`);

    this.ws.onopen = () => {
      console.info(`Hamsters.js ${this.hamsters.version} connection established`);
      this.ws.send(JSON.stringify({
        type: 'register',
        logicalCores: this.hamsters.maxThreads
      }));
      this.sendHeartBeat(this.heartBeatInterval);
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleWebSocketMessage(message);
    };

    this.ws.onerror = (error) => {
      if (this.hamsters.habitat.debug) {
        console.error(`Hamsters.js ${this.hamsters.version} connection error:`, error);
      }
    };

    this.ws.onclose = () => {
      if (this.hamsters.habitat.debug) {
        console.info(`Hamsters.js ${this.hamsters.version} connection closed. Reconnecting...`);
      }
      this.establishConnection();
    };
  }

  handleWebSocketMessage(message) {
    const handlers = {
      'register': this.handleClientReconnect.bind(this),
      'update-client-list': this.updateClientList.bind(this),
      'offer': this.handleOffer.bind(this),
      'answer': this.handleAnswer.bind(this),
      'candidate': this.handleCandidate.bind(this)
    };

    const handler = handlers[message.type];
    if (handler) {
      handler(message);
    } else if (this.hamsters.habitat.debug) {
      console.info(`Hamsters.js ${this.hamsters.version} unknown message type: ${message.type}`);
    }
  }

  sendHeartBeat(interval) {
    this.heartBeatTimeout = setInterval(() => {
      this.ws.send(JSON.stringify({
        type: 'heartbeat'
      }));
      this.lastHeartbeat = Date.now();
    }, interval);
  }

  updateClientList(clientListMessage) {
    const clients = clientListMessage.clients;
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
    this.clientInfo.delete(clientId);
  }

  handleClientReconnect(message) {
    const newClientId = message.id;

    if (this.clientId === newClientId) {
      if (this.hamsters.habitat.debug) {
        console.log(`Hamsters.js ${this.hamsters.version} reconnected with same ID`);
      }
      return;
    }
    this.handleClientDisconnect(newClientId);
    this.clientId = newClientId;
  }

  createConnection(targetClient) {
    if (targetClient === this.clientId || this.remoteConnections.get(targetClient)) {
      return;
    }

    const servers = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    const localConnection = new RTCPeerConnection(servers, this.pcConstraint);

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

    localConnection.ondatachannel = (event) => {
      this.dataChannelCallback(event, targetClient);
    };

    this.findOrCreateChannel(targetClient, localConnection);

    this.remoteConnections.set(targetClient, localConnection);
    localConnection.createOffer().then(desc => {
      localConnection.setLocalDescription(desc);
      this.ws.send(JSON.stringify({ type: 'offer', target: targetClient, offer: desc }));
    }).catch(this.onCreateSessionDescriptionError.bind(this));
  }

  handleOffer(data) {
    const targetClient = data.from;
    console.log('WE HAVE A OFFER ', data);
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
        this.dataChannelCallback(event, targetClient);
      };

      remoteConnection.setRemoteDescription(new RTCSessionDescription(data.offer)).then(() => {
        return remoteConnection.createAnswer();
      }).then(desc => {
        this.ws.send(JSON.stringify({ type: 'answer', target: targetClient, logicalCores: this.hamsters.maxThreads, userAgent: navigator.userAgent, answer: desc }));
        return remoteConnection.setLocalDescription(desc);
      }).catch(this.onCreateSessionDescriptionError.bind(this));

      this.remoteConnections.set(targetClient, remoteConnection);
      this.findOrCreateChannel(targetClient, remoteConnection);
    }
  }

  findOrCreateChannel(targetClient, remoteConnection) {
    let sendChannel = this.sendChannels.get(targetClient);
    if(!sendChannel) {
      const dataConstraint = {
        ordered: true,
        maxRetransmits: 3,
        id: Math.floor(Math.random() * 65536)
      };
      sendChannel = remoteConnection.createDataChannel('hamstersjs', dataConstraint);
      
      sendChannel.onopen = () => {
        this.onSendChannelStateChange(targetClient);
      };

      sendChannel.onclose = () => {
        this.onSendChannelStateChange(targetClient);
      };

      sendChannel.onmessage = (event) => {
        this.onReceiveMessageCallback(targetClient, event.data);
      };

      this.sendChannels.set(targetClient, sendChannel);
    }
    return sendChannel
  }
  
  dataChannelCallback(event, targetClient) {
    const dataChannel = event.channel;
    const currentTargetClient = targetClient;

    dataChannel.onmessage = (event) => {
      this.onReceiveMessageCallback(currentTargetClient, event.data);
    };

    this.sendChannels.set(currentTargetClient, dataChannel);
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
    this.remoteConnections.set(data.from, connection);
  }

  handleCandidate(data) {
    let connection = this.remoteConnections.get(data.from);
    if(!connection) {
      this.storeClientConnectionInfo(data);
      connection = this.remoteConnections.get(data.from);
    }
    connection.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(this.onAddIceCandidateError.bind(this));
    this.remoteConnections.set(data.from, connection);
  }

  distributeTask(task, hamsterFood, resolve, reject) {
    const targetClient = task.input.client || this.getDistributedClient();
    if (!targetClient) {
      if (this.hamsters.habitat.debug) {
        console.error(`Hamsters.js ${this.hamsters.version} no target client found.`);
      }
      reject('No target client found.');
      return;
    }

    const messageId = this.generateUniqueId();
    const preparedList = this.hamsters.data.getTransferList(hamsterFood, task);
    const distributedSubTask = {
      hamsterFood: preparedList.hamsterFood,
      index: hamsterFood.index,
      task: preparedList.task,
      messageId: messageId,
      type: 'task-request'
    };
    const clients = [targetClient];
    this.pendingPromises.set(messageId, { resolve, reject, clients });
    
    if (preparedList.transferCount > 0) {
      this.pendingTransfers.set(messageId, preparedList.transferList);
    }
    this.sendData({ targetClient, data: distributedSubTask });
  }

  getDistributedClient() {
    const sendChannelKeys = Object.keys(this.sendChannels.getData());
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
      if (channel.readyState === 'open' && client && client.latency < minLatency) {
        minLatency = client.latency;
        targetClient = clientId;
      }
    });

    return targetClient;
  }

  initializeDistributedTask(targetClient, task, messageId) {
    const awaitingTransfers = {};
    
    Object.keys(task.hamsterFood).forEach(key => {
      if (task.hamsterFood[key] === 'Awaiting Transfer') {
        awaitingTransfers[key] = 'Awaiting Transfer';
      }
    });

    if (Object.keys(awaitingTransfers).length > 0) {
      this.awaitingTransfers.set(targetClient, { transfers: awaitingTransfers, messageId });
      this.requestNextTransfer(targetClient, messageId);
    } else {
      this.runDistributedTask(task, targetClient);
    }
  }

  requestNextTransfer(targetClient, messageId) {
    if (this.lastRequestedTransfers.get(targetClient)) {
      // A transfer is already in progress for this client
      return;
    }

    const awaitingTransfersData = this.awaitingTransfers.get(targetClient);
    if (!awaitingTransfersData) return;

    const { transfers, messageId: awaitingMessageId} = awaitingTransfersData;
    const keys = Object.keys(transfers);

    if (keys.length > 0 && messageId === awaitingMessageId) {
      const nextKey = keys.find(key => transfers[key] === 'Awaiting Transfer');
      if (nextKey) {
        this.requestDataTransfer(nextKey, messageId, targetClient);
      }
    }
  }

  requestDataTransfer(key, messageId, targetClient) {
    const message = {
      type: 'transfer-request',
      key: key,
      messageId: messageId
    };
    this.lastRequestedTransfers.set(targetClient, {key, messageId});
    this.sendData({targetClient, data: message});

    // Update the status of the transfer item
    const awaitingTransfers = this.awaitingTransfers.get(targetClient) || {transfers: {}};
    awaitingTransfers.transfers[key] = 'Requested Transfer';
    this.awaitingTransfers.set(targetClient, awaitingTransfers);

    if (this.hamsters.habitat.debug) {
      console.log(`Hamsters.js ${this.hamsters.version} requested transfer for ${key} from ${targetClient}`);
    }
  }

  handleTransferResponse(targetClient, transferData) {
    const lastRequestedTransfer = this.lastRequestedTransfers.get(targetClient);
    
    if (!lastRequestedTransfer) {
      console.error(`Hamsters.js ${this.hamsters.version} received transfer response but no transfer was requested for ${targetClient}`);
      return;
    }

    const key = lastRequestedTransfer.key;
    const messageId = lastRequestedTransfer.messageId || null;
    const responseId = lastRequestedTransfer.responseId || null;
    const pendingTask = this.pendingTasks.get(targetClient);
    const awaitingTransfers = this.awaitingTransfers.get(targetClient);

    const isRequestedTransfer = awaitingTransfers && awaitingTransfers.transfers[key] === 'Requested Transfer';

    if (pendingTask && isRequestedTransfer) {
      // Convert ArrayBuffer back to the appropriate data type
      pendingTask.hamsterFood[key] = this.convertFromArrayBuffer(transferData, key);

      // Remove the transferred item from awaitingTransfers
      delete awaitingTransfers.transfers[key];

      if (Object.keys(awaitingTransfers.transfers).length === 0) {
        // All transfers complete
        this.awaitingTransfers.delete(targetClient);
        this.pendingTasks.delete(targetClient);
        this.lastRequestedTransfers.delete(targetClient);
        this.runDistributedTask(pendingTask, targetClient);
      } else {
        // More transfers needed
        this.awaitingTransfers.set(targetClient, awaitingTransfers);
        this.lastRequestedTransfers.delete(targetClient);
        this.requestNextTransfer(targetClient, lastRequestedTransfer.messageId);
      }

      if (this.hamsters.habitat.debug) {
        console.log(`Hamsters.js ${this.hamsters.version} processed transfer response for ${key} from ${targetClient}`);
      }
    } else if (key === 'output') {
      this.handleTaskResponse(targetClient, { output: this.convertFromArrayBuffer(transferData), messageId, responseId });
    } else {
      console.error(`Hamsters.js ${this.hamsters.version} received unexpected transfer response for ${targetClient}`);
    }
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
    const sendChannel = this.sendChannels.get(targetClient);
    if (sendChannel && sendChannel.readyState === 'open') {
      sendChannel.send(JSON.stringify({ type: 'pong', startTime }));
      if (this.hamsters.habitat.debug) {
        console.log(`Hamsters.js ${this.hamsters.version} sent pong to ${targetClient}`);
      }
    }
  }

  handlePong(targetClient, startTime) {
    const latency = performance.now() - startTime;
    const clientInfo = this.clientInfo.get(targetClient) || {};
    clientInfo.latency = latency;
    this.clientInfo.set(targetClient, clientInfo);
    if (this.hamsters.habitat.debug) {
      console.log(`Hamsters.js ${this.hamsters.version} received pong from ${targetClient} with latency: ${latency.toFixed(2)}ms`);
    }
  }

  runDistributedTask(taskMessage, targetClient) {
    let task = taskMessage.task;
    task.targetClient = targetClient;
    task.messageId = taskMessage.messageId;
    task.type = 'task-response';
    console.log("RUNNING DISTRIBUTED TASK");
    return new Promise((resolve, reject) => {
      this.hamsters.scheduleTask(task, this.returnDistributedOutput, this.returnDistributedOutput);
    });
  }
  
  sendDataResponse(responseData) {
    const { targetClient, messageId, output } = responseData;
    console.log("SeNDING OUTPUT RESPNSE TO ", targetClient);
    this.initializeOutputTransfer(targetClient, output, messageId);
  }

  initializeOutputTransfer(targetClient, output, messageId) {
    const responseId = this.generateUniqueId();
    this.pendingOutputs.set(responseId, { targetClient, output, messageId });

    const initialResponse = {
      type: 'task-response',
      messageId,
      responseId,
      awaitingTransfers: true
    };

    this.sendData({ targetClient, data: initialResponse });

    if (this.hamsters.habitat.debug) {
      console.log(`Hamsters.js ${this.hamsters.version} initialized output transfer for ${targetClient} (responseId: ${responseId})`);
    }
  }

  handleOutputTransferRequest(targetClient, message) {
    const { responseId } = message;
    const pendingOutput = this.pendingOutputs.get(responseId);

    if (pendingOutput && pendingOutput.targetClient === targetClient) {
      const arrayBuffer = this.getArrayBuffer(pendingOutput.output);
      this.sendBlobData({ targetClient, data: arrayBuffer, dataType: 'arrayBuffer' });
      this.pendingOutputs.delete(responseId);

      if (this.hamsters.habitat.debug) {
        console.log(`Hamsters.js ${this.hamsters.version} sent output transfer for ${targetClient} (responseId: ${responseId})`);
      }
    } else {
      console.error(`Hamsters.js ${this.hamsters.version} received unexpected output transfer request for ${targetClient}`);
    }
  }

  getArrayBuffer(transferredData) {
    if (ArrayBuffer.isView(transferredData)) {
      return transferredData.buffer;
    }
    if (transferredData instanceof ArrayBuffer) {
      return transferredData;
    }
    return new Uint8Array(transferredData).buffer
  }

  convertFromArrayBuffer(buffer, key) {
    const originalArray = new Uint8Array(buffer);
    if(this.hamsters.habitat.node) { //Node.js has stricter security and won't allow the transfer of buffers sent using node.js webrtc channels, clone into new array first
      const newArrayBuffer = new ArrayBuffer(originalArray.byteLength);
      const newTypedArray = new Uint8Array(newArrayBuffer);
      newTypedArray.set(originalArray);
      return newTypedArray;
    }
    return originalArray;
  }

  sendData({ targetClient, data }) {
    const sendChannel = this.sendChannels.get(targetClient);
    if (sendChannel && sendChannel.readyState === 'open') {
      sendChannel.send(JSON.stringify(data));
      if (this.hamsters.habitat.debug) {
        console.log(`Hamsters.js ${this.hamsters.version} sent data to: ${targetClient}`);
      }
    } else {
      if (this.hamsters.habitat.debug) {
        console.error(`Hamsters.js ${this.hamsters.version} send channel is not open for targetClient: ${targetClient}`);
      }
    }
  }

  sendBlobData({targetClient, data, dataType}) {
    const sendChannel = this.sendChannels.get(targetClient);
    if (sendChannel && sendChannel.readyState === 'open') {
      sendChannel.send(data);
      if (this.hamsters.habitat.debug) {
        console.log(`Hamsters.js ${this.hamsters.version} sent blob data to: ${targetClient}`);
      }
    } else {
      if (this.hamsters.habitat.debug) {
        console.error(`Hamsters.js ${this.hamsters.version} send channel is not open for targetClient: ${targetClient}`);
      }
    }
  }

  // Function to convert Blob to ArrayBuffer using Fetch API
  async blobToArrayBuffer(blob) {
    if (typeof fetch === 'function') { // Check if Fetch API is available
        const response = new Response(blob);
        return await response.arrayBuffer();
    } else {
        throw new Error('Fetch API is not supported in this environment.');
    }
  }

  async onReceiveMessageCallback(targetClient, messageData) {
    if(messageData instanceof Blob) {
      messageData = await this.blobToArrayBuffer(messageData);
    }
    if (messageData instanceof ArrayBuffer) {
      this.handleTransferResponse(targetClient, messageData);
    } else if (typeof messageData === 'string') {
      let incomingMessage;
      try {
        incomingMessage = JSON.parse(messageData);
        this.handleIncomingMessage(targetClient, incomingMessage);
      } catch (error) {
        console.error(`Hamsters.js ${this.hamsters.version} error parsing message:`, error);
      }
    } else {
      console.log("Received unexpected data type:", targetClient, messageData);
    }
  }

  handleIncomingMessage(targetClient, incomingMessage) {
    const handlers = {
      'transfer-request': this.fulfillTransferRequest.bind(this),
      'task-request': this.handleTaskRequest.bind(this),
      'transfer-response': this.processTransferResponse.bind(this),
      'output-transfer-request': this.handleOutputTransferRequest.bind(this),
      'task-response': this.handleTaskResponse.bind(this),
      'ping': (client, message) => this.handlePing(client, message.startTime),
      'pong': (client, message) => this.handlePong(client, message.startTime)
    };

    const handler = handlers[incomingMessage.type];
    if (handler) {
      handler(targetClient, incomingMessage);
    } else {
      console.log(`Hamsters.js ${this.hamsters.version} unknown message received from: ${targetClient}`);
    }
  }

  handleTaskRequest(targetClient, incomingMessage) {
    const awaitingTransfers = Object.values(incomingMessage.hamsterFood).some(value => value === 'Awaiting Transfer');
    if (awaitingTransfers) {
      this.pendingTasks.set(targetClient, incomingMessage);
      this.initializeDistributedTask(targetClient, incomingMessage, incomingMessage.messageId);
    } else {
      this.runDistributedTask(incomingMessage, targetClient);
    }
  }

  handleTaskResponse(targetClient, message) {
    const { messageId, responseId, awaitingTransfers } = message;
    const pendingPromise = this.pendingPromises.get(messageId);
    if (pendingPromise && pendingPromise.clients.indexOf(targetClient) !== -1) { //Ensure we only process responses we have a pending promise for the sending client
      if(awaitingTransfers) {
        this.requestOutputTransfer(targetClient, responseId, messageId);
      } else {
        pendingPromise.resolve(message.output);
        this.pendingPromises.delete(messageId);
      }
    } else {
      console.warn(`Received a message from ${targetClient} but no matching promise found with messageId ${messageId}`);
    }
  }

  requestOutputTransfer(targetClient, responseId, messageId) {
    const outputTransferRequest = {
      type: 'output-transfer-request',
      key: 'output',
      responseId,
      messageId
    };
    this.lastRequestedTransfers.set(targetClient, outputTransferRequest);
    this.sendData({ targetClient, data: outputTransferRequest });
  }

  requestDataTransfer(key, messageId, targetClient) {
    const message = {
      type: 'transfer-request',
      key: key,
      messageId: messageId
    };
    this.lastRequestedTransfers.set(targetClient, { key, messageId });
    this.sendData({targetClient, data: message});

    // Update the status of the transfer item
    const awaitingTransfersData = this.awaitingTransfers.get(targetClient);
    if (awaitingTransfersData && awaitingTransfersData.messageId === messageId) {
      awaitingTransfersData.transfers[key] = 'Requested Transfer';
      this.awaitingTransfers.set(targetClient, awaitingTransfersData);
    }

    if (this.hamsters.habitat.debug) {
      console.log(`Hamsters.js ${this.hamsters.version} requested transfer for ${key} from ${targetClient} (messageId: ${messageId})`);
    }
  }

  fulfillTransferRequest(targetClient, incomingMessage) {
    const { key, messageId, responseId } = incomingMessage;
    const transferId = responseId || messageId;
    const pendingTransferItems = this.pendingTransfers.get(transferId);

    if (pendingTransferItems && pendingTransferItems[key]) {
      const data = pendingTransferItems[key];
      
      // Get the ArrayBuffer efficiently based on data type
      const arrayBuffer = this.getArrayBuffer(data);

      // Send the data as ArrayBuffer
      this.sendBlobData({ targetClient, data: arrayBuffer, dataType: 'arrayBuffer' });

      if (this.hamsters.habitat.debug) {
        console.log(`Hamsters.js ${this.hamsters.version} sent transfer response for ${key} (${responseId ? 'output' : 'input'}) to ${targetClient} (messageId: ${messageId})`);
      }

      // Clean up after sending
      delete pendingTransferItems[key];
      if (Object.keys(pendingTransferItems).length === 0) {
        this.pendingTransfers.delete(transferId);
      }
    } else {
      console.error(`No pending transfer found for ${key} (${responseId ? 'output' : 'input'}) for ${targetClient} (messageId: ${messageId})`);
    }
  }

  processTransferResponse(targetClient, incomingMessage) {
    const { key, data, messageId, responseId } = incomingMessage;
    
    if (responseId) {
      // This is an output transfer
      const pendingPromise = this.pendingPromises.get(messageId);
      if (pendingPromise) {
        pendingPromise.resolve(data);
        this.pendingPromises.delete(messageId);
      } else {
        console.warn(`Hamsters.js ${this.hamsters.version} no pending promise found for messageId: ${messageId}`);
      }
    } else {
      // This is an input transfer
      const pendingTask = this.pendingTasks.get(targetClient);
      if (pendingTask && pendingTask.messageId === messageId) {
        pendingTask.hamsterFood[key] = this.convertFromArrayBuffer(data);
        
        const stillAwaiting = Object.values(pendingTask.hamsterFood).some(value => value === 'Awaiting Transfer');
        
        if (stillAwaiting) {
          this.requestNextTransfer(targetClient, messageId);
        } else {
          this.pendingTasks.delete(targetClient);
          this.runDistributedTask(pendingTask, targetClient);
        }
      } else {
        console.warn(`Hamsters.js ${this.hamsters.version} no pending task found for targetClient: ${targetClient} and messageId: ${messageId}`);
      }
    }

    if (this.hamsters.habitat.debug) {
      console.log(`Hamsters.js ${this.hamsters.version} processed transfer response for ${key} from ${targetClient}`);
    }
  }

  onSendChannelStateChange(targetClient) {
    const sendChannel = this.sendChannels.get(targetClient);
    if (sendChannel && sendChannel.readyState === 'open') {
      this.measureLatency(targetClient);
    }
    if (sendChannel && this.hamsters.habitat.debug) {
      console.log(`Hamsters.js ${this.hamsters.version} send channel state changed for ${targetClient}: ${sendChannel.readyState}`);
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