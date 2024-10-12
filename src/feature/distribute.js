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
    this.pendingPromises = new Map(); // targetClient -> Map(messageId -> promiseDetails)
    this.pendingTasks = new hamsters.observable({});
    this.pendingTransfers = new hamsters.observable({});
    this.awaitingTransfers = new hamsters.observable({});
    this.lastRequestedTransfers = new hamsters.observable({});
    this.pendingOutputs = new hamsters.observable({});
    this.returnDistributedOutput = this.sendDataResponse.bind(this);
    this.establishConnection = this.initWebSocket.bind(this);
    this.lastHeartbeat = {};
    this.heartBeatInterval = 30 * 1000; //Send heartbeat message every 30 seconds
    this.deletedPromises = [];
    this.heartBeatTimeout = {};
    this.messageCounter = 0;
    this.generatedMessageIds = [];
    this.promiseTimeoutDuration = 60000; // 60 seconds timeout
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
      this.startPromiseCleanupInterval(this.promiseTimeoutDuration);
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
      this.remoteConnections.delete(clientId, 'peer');
    }
    if (this.sendChannels.get(clientId)) {
      this.sendChannels.get(clientId).close();
      this.sendChannels.delete(clientId, 'channel');
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

      this.remoteConnections.set(targetClient, remoteConnection, 'peer');
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

      this.sendChannels.set(targetClient, sendChannel, 'channel');
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

  distributeTask(task, resolve, reject) {
    const targetClient = task.input.client || this.getDistributedClient();
    if (!targetClient) {
      if (this.hamsters.habitat.debug) {
        console.error(`Hamsters.js ${this.hamsters.version} no target client found.`);
      }
      reject('No target client found.');
      return;
    }
  
    const messageId = this.generateUniqueId();
    const preparedList = this.hamsters.data.getTransferList(task);
    const distributedSubTask = {
      hamsterFood: preparedList.hamsterFood,
      task: preparedList.task,
      messageId: messageId,
      type: 'task-request'
    };
  
    if (!this.pendingPromises.has(targetClient)) {
      this.pendingPromises.set(targetClient, new Map());
    }
    this.pendingPromises.get(targetClient).set(messageId, { resolve, reject, state: 'pending' });
    
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
    const transferList = Object.keys(task.hamsterFood)
    .filter(key => task.hamsterFood[key] === 'Awaiting Transfer')
    .reduce((transfers, key) => {
      transfers[key] = 'Awaiting Transfer';
      return transfers;
    }, {});
  

    if (Object.keys(transferList).length > 0) {
      let currentAwaitingTransfers = this.awaitingTransfers.get(targetClient);
      if(!currentAwaitingTransfers) {
        currentAwaitingTransfers = [];
      }
      currentAwaitingTransfers.push({
        messageId: messageId,
        transferList: transferList
      });
      this.awaitingTransfers.set(targetClient, currentAwaitingTransfers);
      this.requestNextTransfer(targetClient, messageId);
    } else {
      this.runDistributedTask(task, targetClient);
    }
  }

  requestNextTransfer(targetClient, messageId) {
    const requestedTransfers = this.lastRequestedTransfers.get(targetClient);
    let lastRequestedTransfer = null;
    if(requestedTransfers) {
      lastRequestedTransfer = requestedTransfers.find(item => item.messageId === messageId);
      if (lastRequestedTransfer) {
        console.info("We already requested this transfer for this task");
        return;
      }
    }
    const currentAwaitingTransfers = this.awaitingTransfers.get(targetClient);
    if (currentAwaitingTransfers) {
      const awaitingTransfer = currentAwaitingTransfers.find(item => item.messageId === messageId);
      if (awaitingTransfer) {
        this.requestTransferFromList(awaitingTransfer, messageId, targetClient);
      }
    }
  }
  
  requestTransferFromList(awaitingTransfer, messageId, targetClient) {
    const transferKeys = Object.keys(awaitingTransfer.transferList);
    if (transferKeys.length > 0) {
      const nextKey = transferKeys.find(key => awaitingTransfer.transferList[key] === 'Awaiting Transfer');
      if (nextKey) {
        this.updateTransferStatus(targetClient, messageId, nextKey, 'Requested Transfer');
        this.requestDataTransfer(nextKey, messageId, targetClient);
      }
    }
  }
  
  updateTransferStatus(targetClient, messageId, key, status) {
    // Get the current awaitingTransfers array for the target client
    const currentAwaitingTransfers = this.awaitingTransfers.get(targetClient);
    
    if (!currentAwaitingTransfers) {
      console.error(`Hamsters.js ${this.hamsters.version} no awaiting transfers found for ${targetClient}`);
      return;
    }
  
    // Find the correct awaitingTransfer object by messageId
    const awaitingTransfer = currentAwaitingTransfers.find(item => item.messageId === messageId);
  
    if (!awaitingTransfer) {
      console.error(`Hamsters.js ${this.hamsters.version} no awaiting transfer found for messageId ${messageId}`);
      return;
    }
  
    // Update the status of the transfer key in the transferList
    awaitingTransfer.transferList[key] = status;
  
    // Set the updated awaitingTransfers back to the client
    this.awaitingTransfers.set(targetClient, currentAwaitingTransfers);
  }
  
  
  handleTransferResponse(targetClient, transferData) {
    let requestedTransfers = this.lastRequestedTransfers.get(targetClient);
  
    if (!requestedTransfers || requestedTransfers.length === 0) {
      console.error(`Hamsters.js ${this.hamsters.version} received transfer response but no transfer was requested for ${targetClient}`);
      return;
    }
  
    const currentRequestedTransfer = requestedTransfers[0]; // Always get the first requested transfer
    const key = currentRequestedTransfer.key;
    const messageId = currentRequestedTransfer.messageId || null;
    const responseId = currentRequestedTransfer.responseId || null;
  
    if (responseId) {
      // This is an output transfer
      const clientPromises = this.pendingPromises.get(targetClient);
      if (clientPromises) {
        for (const [promiseMessageId, promiseDetails] of clientPromises) {
          if (promiseDetails.responseId === responseId) {
            const output = this.convertFromArrayBuffer(transferData, key);
            promiseDetails.resolve(output);
            clientPromises.delete(promiseMessageId);
            if (clientPromises.size === 0) {
              this.pendingPromises.delete(targetClient);
            }
            break;
          }
        }
      } else {
        console.warn(`Hamsters.js ${this.hamsters.version} no pending promises found for ${targetClient}`);
      }
    } else {
      // This is an input transfer
      const pendingTasks = this.pendingTasks.get(targetClient);
      if (pendingTasks) {
        const currentTaskIndex = pendingTasks.findIndex(item => item.messageId === messageId);
  
        if (currentTaskIndex > -1) {
          const currentTask = pendingTasks[currentTaskIndex];
          currentTask.hamsterFood[key] = this.convertFromArrayBuffer(transferData, key);
  
          const stillAwaiting = Object.values(currentTask.hamsterFood).some(value => value === 'Awaiting Transfer');
  
          if (stillAwaiting) {
            this.requestNextTransfer(targetClient, messageId);
          } else {
            // Remove only the current task from the pendingTasks array
            pendingTasks.splice(currentTaskIndex, 1);
  
            // If there are no more tasks for this client, clean up the pendingTasks map
            if (pendingTasks.length === 0) {
              this.pendingTasks.delete(targetClient);
            } else {
              this.pendingTasks.set(targetClient, pendingTasks); // Update remaining pending tasks
            }
  
            // Run the task after all transfers have been completed
            this.runDistributedTask(currentTask, targetClient);
          }
        } else {
          console.warn(`Hamsters.js ${this.hamsters.version} no pending task found for targetClient: ${targetClient} and messageId: ${messageId}`);
        }
      } else {
        console.warn(`Hamsters.js ${this.hamsters.version} no pending task found for targetClient: ${targetClient} and messageId: ${messageId}`);
      }
    }
  
    // Cleanup requested transfers
    requestedTransfers = requestedTransfers.slice(1); // Removes the first item (currentRequestedTransfer)
    if (requestedTransfers.length === 0) {
      this.lastRequestedTransfers.delete(targetClient);
    } else {
      this.lastRequestedTransfers.set(targetClient, requestedTransfers); // Update remaining transfers
    }
  
    if (this.hamsters.habitat.debug) {
      console.log(`Hamsters.js ${this.hamsters.version} processed transfer response for ${key} from ${targetClient}`);
    }
  } 
  
  measureLatency(targetClient) {
    const startTime = performance.now();
    this.sendPing(targetClient, startTime);
  }

  sendPing(targetClient, startTime) {
    const sendChannel = this.sendChannels.get(targetClient);
    if (sendChannel && sendChannel.readyState === 'open') {
      sendChannel.send(JSON.stringify({ type: 'ping', startTime}));
    }
  }

  handlePing(targetClient, startTime) {
    const sendChannel = this.sendChannels.get(targetClient);
    if (sendChannel && sendChannel.readyState === 'open') {
      sendChannel.send(JSON.stringify({ type: 'pong', startTime, threads: this.hamsters.maxThreads }));
      if (this.hamsters.habitat.debug) {
        console.log(`Hamsters.js ${this.hamsters.version} sent pong to ${targetClient}`);
      }
    }
  }

  handlePong(targetClient, startTime, clientThreads) {
    const latency = performance.now() - startTime;
    const clientInfo = this.clientInfo.get(targetClient) || {};
    clientInfo.latency = latency;
    clientInfo.logicalCores = clientThreads;
    this.clientInfo.set(targetClient, clientInfo);
    if (this.hamsters.habitat.debug) {
      console.log(`Hamsters.js ${this.hamsters.version} received pong from ${targetClient} with latency: ${latency.toFixed(2)}ms`);
    }
  }

  runDistributedTask(taskMessage, targetClient) {
    let task = taskMessage.task;
    task.targetClient = targetClient;
    task.messageId = taskMessage.messageId;
    task.input = taskMessage.hamsterFood;
    task.type = 'task-response';
    console.log("RUNNING DISTRIBUTED TASK");
    this.hamsters.scheduleTask(task, this.returnDistributedOutput, this.returnDistributedOutput);
  }
  
  sendDataResponse(responseData) {
    const { targetClient, messageId, output } = responseData;
    const responseId = this.generateUniqueId();
    this.initializeOutputTransfer(targetClient, output, messageId, responseId);
  }

  initializeOutputTransfer(targetClient, output, messageId, responseId) {
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
      'pong': (client, message) => this.handlePong(client, message.startTime, message.threads)
    };

    const handler = handlers[incomingMessage.type];
    if (handler) {
      handler(targetClient, incomingMessage);
    } else {
      console.log(`Hamsters.js ${this.hamsters.version} unknown message received from: ${targetClient}`);
    }
  }

  handleTaskRequest(targetClient, incomingMessage) {
    let currentPendingTasks = this.pendingTasks.get(targetClient);
    if(!currentPendingTasks) {
      currentPendingTasks = [];
    }
    currentPendingTasks.push(incomingMessage);
    this.pendingTasks.set(targetClient, currentPendingTasks);
    const awaitingTransfers = Object.values(incomingMessage.hamsterFood).some(value => value === 'Awaiting Transfer');
    if (awaitingTransfers) {
      this.initializeDistributedTask(targetClient, incomingMessage, incomingMessage.messageId);
    } else {
      this.runDistributedTask(incomingMessage, targetClient);
    }
  }

  startPromiseCleanupInterval(cleanupInterval) {
    setInterval(() => this.cleanupStalePendingPromises(), cleanupInterval);
  }
  
  cleanupStalePendingPromises() {
    const now = Date.now();
    for (const [targetClient, clientPromises] of this.pendingPromises) {
      for (const [messageId, promiseDetails] of clientPromises) {
        if (now - promiseDetails.timestamp > this.promiseTimeoutDuration) {
          promiseDetails.reject(new Error('Task timed out'));
          clientPromises.delete(messageId);
        }
      }
      if (clientPromises.size === 0) {
        this.pendingPromises.delete(targetClient);
      }
    }
  }

  handleTaskResponse(targetClient, message) {
    const { messageId, responseId, awaitingTransfers, output } = message;
    const clientPromises = this.pendingPromises.get(targetClient);
    
    if (clientPromises && clientPromises.has(messageId)) {
      const promiseDetails = clientPromises.get(messageId);
      
      if (awaitingTransfers && responseId) {
        promiseDetails.state = 'awaitingTransfer';
        promiseDetails.responseId = responseId;
        this.requestOutputTransfer(targetClient, responseId, messageId);
      } else {
        promiseDetails.resolve(output);
        clientPromises.delete(messageId);
        if (clientPromises.size === 0) {
          this.pendingPromises.delete(targetClient);
        }
      }
    } else {
      console.warn(`Received a message from ${targetClient} but no matching promise found with messageId ${messageId}`);
    }
  }

  requestOutputTransfer(targetClient, responseId, messageId) {
    let requestedTransfers = this.lastRequestedTransfers.get(targetClient);
    if(!requestedTransfers) {
      requestedTransfers = [];
    }
    const outputTransferRequest = {
      type: 'output-transfer-request',
      key: 'output',
      responseId,
      messageId
    };
    requestedTransfers.push(outputTransferRequest);
    this.lastRequestedTransfers.set(targetClient, requestedTransfers);
    this.sendData({ targetClient, data: outputTransferRequest });
  }

  requestDataTransfer(key, messageId, targetClient) {
    let requestedTransfers = this.lastRequestedTransfers.get(targetClient);
    if(!requestedTransfers) {
      requestedTransfers = [];
    }
    const message = {
      type: 'transfer-request',
      key: key,
      messageId: messageId
    };
    requestedTransfers.push(message);
    this.lastRequestedTransfers.set(targetClient, requestedTransfers);
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
      const pendingTasks = this.pendingTasks.get(targetClient);
      if (pendingTasks) {
        const currentTaskIndex = pendingTasks.findIndex(item => item.messageId === messageId);
  
        if (currentTaskIndex > -1) {
          const currentTask = pendingTasks[currentTaskIndex];
          currentTask.hamsterFood[key] = this.convertFromArrayBuffer(data);
  
          const stillAwaiting = Object.values(currentTask.hamsterFood).some(value => value === 'Awaiting Transfer');
  
          if (stillAwaiting) {
            this.requestNextTransfer(targetClient, messageId);
          } else {
            // Remove only the current task from the pendingTasks array
            pendingTasks.splice(currentTaskIndex, 1);
  
            // If there are no more tasks for this client, clean up the pendingTasks map
            if (pendingTasks.length === 0) {
              this.pendingTasks.delete(targetClient);
            } else {
              this.pendingTasks.set(targetClient, pendingTasks); // Update remaining pending tasks
            }
  
            // Run the task after all transfers have been completed
            this.runDistributedTask(currentTask, targetClient);
          }
        } else {
          console.warn(`Hamsters.js ${this.hamsters.version} no pending task found for targetClient: ${targetClient} and messageId: ${messageId}`);
        }
      } else {
        console.warn(`Hamsters.js ${this.hamsters.version} no pending task found for targetClient: ${targetClient} and messageId: ${messageId}`);
      }
    }
  
    // Cleanup requested transfers
    const requestedTransfers = this.lastRequestedTransfers.get(targetClient);
    if (requestedTransfers) {
      requestedTransfers.shift(); // Remove the first item (FIFO)
      if (requestedTransfers.length === 0) {
        this.lastRequestedTransfers.delete(targetClient);
      } else {
        this.lastRequestedTransfers.set(targetClient, requestedTransfers); // Update remaining transfers
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
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  this.messageCounter = (this.messageCounter + 1) % 1000000;
  return `${timestamp}-${random}-${this.messageCounter.toString(36).padStart(5, '0')}`;
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