/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Thread } from 'react-native-threads'; // 0.0.10
import hamsters from './hamsters/hamsters';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' +
    'Cmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

hamsters.init({
  Worker: Thread
});

export default class App extends Component<Props> {
  render() {
    this.executeHamsters();
    
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to React Native!
        </Text>
        <Text style={styles.instructions}>
          To get started, edit App.js
        </Text>
        <Text style={styles.instructions}>
          {instructions}
        </Text>
      </View>
    );
  }
  
  executeHamsters() {
    var params = {
      array: [1, 2, 3, 4],
      threads: 4
    };
  
    hamsters.run(params, function() {
      for(var i = 0; i < params.array; i++) {
        rtn.data.push(params.array[i] * 4);
      }
    }, function(results) {
      console.debug('results', results);
    });
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});