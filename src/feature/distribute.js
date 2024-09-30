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
    this.pendingTasks = new hamsters.observable({});
    this.pendingTransfers = new hamsters.observable({});
    this.awaitingTransfers = new hamsters.observable({});
    this.returnDistributedOutput = this.sendDataResponse.bind(this);
    this.establishConnection = this.initWebSocket.bind(this);
    this.lastHeartbeat = {};
    this.heartBeatInterval = 30 * 1000; //Send heartbeat message every 30 seconds, keep socket connection open
    this.heartBeatTimeout = {};
    //Listen for changes to transfers and tasks
    this.setRealTimeListeners();
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
      this.sendHeartBeat(this.heartBeatInterval);
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
        console.info(`Hamsters.js ${this.hamsters.version} connection closed. Reconnecting...`);
      }
      this.establishConnection();
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
  }

  sendHeartBeat(interval) {
    this.heartBeatTimeout = setInterval(() => {
      this.ws.send(JSON.stringify({
        type: 'heartbeat'
      }));
      this.lastHeartbeat = Date.now();
    }, interval);
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
    let connection = this.remoteConnections.get(data.from) || {};
    if(!connection) {
      this.storeClientConnectionInfo(data);
      connection = this.remoteConnections.get(data.from);
    }
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
      if (channel.readyState === 'open' && client.latency < minLatency) {
        minLatency = client.latency;
        targetClient = clientId;
      }
    });

    return targetClient;
  }

  distributeTask(task, hamsterFood, resolve, reject) {
    const targetClient = this.getDistributedClient();
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
      awaitingTransfers: preparedList.transferCount > 0,
      type: 'task-request'
    };

    this.pendingPromises.set(messageId, { resolve, reject });
    this.pendingTransfers.set(messageId, preparedList.transferList);

    this.sendData({ targetClient, data: distributedSubTask });
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

  requestDataTransfer(key, messageId, targetClient) {
    const message = {
      type: 'transfer-request',
      key: key,
      messageId, messageId
    };
    this.awaitingTransfers.set(targetClient, message);
    this.sendData({targetClient, message});
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

  sendBlobData({targetClient, data, dataType}) {
    const sendChannel = this.sendChannels.get(targetClient);
    if (sendChannel && sendChannel.readyState === 'open') {
      if(!data.buffer) {
        data = this.hamsters.data.processDataType(dataType, data);
      }
      sendChannel.send(data.buffer);
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
    for (const targetClient of this.sendChannels.getData().keys()) {
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
    let incomingMessage = data;
    if(typeof data === 'string') {
      incomingMessage = JSON.parse(data);
      
      switch (incomingMessage.type) {
        case 'transfer-request':
            this.fulfillTransferRequest(targetClient, incomingMessage);
          break;
        case 'task-response':
          this.handleTaskResponse(incomingMessage);
          if (this.hamsters.habitat.debug) {
            console.log(`Hamsters.js ${this.hamsters.version} response received for task: `, incomingMessage);
          }
          break;
        case 'task-request':
          if(incomingMessage.awaitingTransfers) {
            this.pendingTasks.set(targetClient, incomingMessage);
          } else {
            this.hamsters.pool.runDistributedTask(incomingMessage, targetClient);
          }
          break;
        default:
          this.processTransferResponse(targetClient, incomingMessage);
          console.log(`Hamsters.js ${this.hamsters.version} unknown message received from: ${targetClient}`);
          break;
      }
    } else {
      console.log("We have a transfer request response", data);
    }
  }

  processTransferResponse(targetClient, incomingMessage) {
    const awaitingTransfer = this.awaitingTransfers.get(targetClient);
    const pendingTask = this.pendingTasks.get(targetClient);
    const hamsterFood = pendingTask.hamsterFood;
    const hamsterFoodKeys = Object.keys(hamsterFood);
    for (const item of hamsterFoodKeys) {
      if ((awaitingTransfer[item] && awaitingTransfer[item].status === 'Requested') && hamsterFood[item] === 'Awaiting Transfer') {
        hamsterFood[item] = incomingMessage;
        break;
      }
    }
    const stillAwaiting = hamsterFoodKeys.filter(key => ['Awaiting Transfer', 'Requested'].indexOf(hamsterFood[key]) !== -1);
    pendingTask.awaitingTransfers = stillAwaiting.length > 0;
    this.pendingTasks.set(targetClient, pendingTask);
    console.log("WE HAVE A PENDING TASK WITH A DATA RESPONSE ", pendingTask);
  }
  

  fulfillTransferRequest(targetClient, incomingMessage) {
    const pendingTransferItems = this.pendingTransfers.get(incomingMessage.messageId);
    const pendingTask = this.pendingTasks.get(targetClient);
    if(pendingTransferItems) {
      const pendingTransferItem = pendingTransferItems[incomingMessage.key];
      if(typeof pendingTransferItem !== 'undefined') {
        this.sendData({targetClient, data: pendingTransferItem});
      }
    }
    console.log(incomingMessage, "WE HAVE TRANSFER REQUEST!", pendingTask);
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

  initializeAwaitingTransfersListener() {
    this.awaitingTransfers.on('change', (awaitingTransfers) => {
      let updatedAwaitingTransfers = {};
      Object.keys(awaitingTransfers).forEach((clientId) => {
        let updatedTransferItems = {};
        const transferObject = awaitingTransfers[clientId];
        Object.keys(transferObject).forEach((item) => {
          const awaitingTransfer = transferObject[item]; // Correct access
          if (awaitingTransfer.status === 'Pending Request') {
            const requestTransferMessage = {
              type: 'transfer-request',
              key: item,
              messageId: awaitingTransfer.messageId // Assuming this is defined in the class scope
            };
            this.sendData({targetClient: clientId, data: requestTransferMessage}); // Correct the function call
            awaitingTransfer.status = 'Requested';
            updatedTransferItems[item] = awaitingTransfer; // Use item as key for updated transfers
  
            // Check if pendingTasks and its structure exist before updating
            if (this.pendingTasks[clientId]) {
              this.pendingTasks[clientId].task.scheduler.transfers.request += 1;
            } else {
              console.error(`Invalid structure for clientId: ${clientId}`);
            }
          }
        });
        updatedAwaitingTransfers[clientId] = updatedTransferItems;
      });
      // Set awaiting transfers with updated information
      this.awaitingTransfers.setAll(updatedAwaitingTransfers);
    },  { passive: true });
  }

  initializePendingTasksListener() {
    this.pendingTasks.on('change', (pendingTasks) => {
      let pendingTaskId = 0;
      let updatedTasks = {};
      Object.keys(pendingTasks).forEach((targetClient) => {
        const pendingTask = pendingTasks[targetClient];
        if (pendingTask.awaitingTransfers) {
          const pendingTask = pendingTasks[targetClient];
          let transferStatus = pendingTask.hamsterFood; // Consider renaming for clarity
          let transfers = {}; // Use an object or array to hold transfers
    
          Object.keys(transferStatus).forEach((item) => {
            if (transferStatus[item] === 'Awaiting Transfer') {
              transfers[item] = { // Use bracket notation to assign multiple transfers
                taskId: pendingTaskId,
                messageId: pendingTask.messageId, // Ensure this is defined
                status: 'Pending Request'
              };
            }
          });
    
          // Add transfers to awaiting transfers for the specific client
          if (Object.keys(transfers).length > 0) {  
            this.awaitingTransfers.set(targetClient, transfers); // Save transfers for this client
          }
          pendingTaskId += 1;
        } else { //We are not waiting for data anymore, we can start processing the task
          this.hamsters.pool.runDistributedTask(pendingTask, targetClient);
        }
      });
    }, { passive: true });
  }

  setRealTimeListeners() {
    this.initializeAwaitingTransfersListener();
    this.initializePendingTasksListener();
  }  
}

export default Distribute;
