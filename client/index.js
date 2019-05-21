'use strict';

const {ServiceBroker} = require('moleculer');
const config = require('../config');
const logger = require('../lib/logger')(__filename);
const NatsTransporter = require("moleculer").Transporters.NATS;
const aes256 = require('nodejs-aes256');


let option = config.get('nats');
option.pass = aes256.decrypt(config.get('api.key'), option.pass);

// Create broker
const broker = new ServiceBroker({
    namespace: 'demo-micro-service',
    nodeID: 'client',
    transporter: new NatsTransporter(option),
    logger: logger
});

// Call actions
broker.start().then(async () => {
    /*
    let arr = [
        broker.call('otp.generate', {clientId: 'asd323'}), //5s
        broker.call('math.add', {a: 5, b: 3}),//2s
        broker.call('math.add', {a: 69, b: 3}),//2s
        broker.call('otp.reject', {clientId: 'asd3000023'}) //7s
    ];
    Promise.all(arr)
        .then((res) => {
            console.log('thread1-----------',res);
        }).catch(err => console.log(err));
*/
    for (let i = 1; i <= 50; i++) {
        let res = await broker.call('math.add', {a: i, b: 3});//2s
        console.log('thread1-----------',res);
    }
})

/*.then(() => {
     return broker.call('math.add', {a: 5, b: 3});
 })
 .then((res) => broker.logger.info(' from cache  5 + 3 = ' + res))
  .then(() => {
     return broker.call('otp.generate', {clientId: '555'})
 }).then((res) => {
 broker.logger.info(res)
})
 .then(() => {
     return broker.call('users.list').then((res) => broker.logger.info('Users count:' + res.length));
 })
 .then(() => {
     broker.emit('user.created', {hello: 'world !!!'}, ['users']);
     return broker.call('users.list').then((res) => broker.logger.info('Users count from cache:' + res.length));
 })
 .then(() => {
     return broker.call('math.add', {a: -5, b: -3, sex: 'test'});
 })*/
    .catch((err) => {
       // console.log(err);
        broker.logger.error(`Error occurred! Action: '${err.ctx.action.name}', Message: ${err.code} - ${err.message}`);
        if (err.data) {
            broker.logger.error('Error data:', err.data);
        }
    });

