'use strict';

const {ServiceBroker} = require('moleculer');
const config = require('../config');
const logger = require('../lib/logger')(__filename);
const NatsTransporter = require("moleculer").Transporters.NATS;
const aes256 = require('nodejs-aes256');
const crypto = require("crypto");

let option = config.get('nats');
option.pass = aes256.decrypt(config.get('api.key'), option.pass);

const broker = new ServiceBroker({
    namespace: 'demo-micro-service',
    nodeID: 'server',
    transporter: new NatsTransporter(option),
    logger: logger,
    cacher: config.get('cacher'),
    validation: true,
    registry: {
        strategy: 'CpuUsage',
        strategyOptions: {
            sampleCount: 3,
            lowCpuUsage: 10
        }
    },
    circuitBreaker: {
        enabled: true,
        threshold: 0.5,
        minRequestCount: 20,
        windowTime: 60, // in seconds
        halfOpenTime: 5 * 1000, // in milliseconds
        check: err => err && err.code >= 500
    }
});

broker.createService({
    name: 'math',
    actions: {
        add: {
            cache: true,
            params: {
                a: {type: 'number', positive: true, integer: true},
                b: {type: 'number', positive: true, integer: true},
                name: {type: 'string', min: 3, max: 255, optional: true},
                sex: {type: 'enum', values: ['male', 'female'], optional: true},
                $$strict: true
            },
            async handler(ctx) {
                this.logger.info(' method called with a as '+ctx.params.a);
                let res = Number(ctx.params.a) + Number(ctx.params.b);
                await Promise.all([
                    new Promise((resolve,reject)=>{})
                ]);
                return res;
            }
        }
    },
    events: {
        'user.created'(user) {
            this.logger.info('User math created:', user);
        }
    }
});

broker.createService({
    name: 'users',
    actions: {
        list: {
            cache: true,
            handler(ctx) {
                this.logger.info('Handler called!');
                broker.broadcast('user.created', {name: 'mir'}, 'mail');
                return [
                    {id: 1, name: 'John'},
                    {id: 2, name: 'Jane'}
                ];
            }
        }
    },
    events: {
        'user.created'(user) {
            this.logger.info('User created:', user);
        }
    }
});

broker.createService({
    name: 'otp',
    actions: {
        generate: {
            cache: false,
            fallback: "getCachedResult",
            params: {
                clientId: {type: 'string'},
                $$strict: true
            },
            handler(ctx) {
                this.logger.info('OTP Service');

                let clientId = ctx.params.clientId;
                if (!clientId) {
                    return {status: 500, message: 'invalid payload'};
                }

                let random = crypto.randomBytes(512).toString('hex');
                let hash = crypto.createHmac('sha512', random);
                hash.update('MAVERICK_TRANSACTION_ID' + clientId);
                let otp = hash.digest('hex');
                otp = otp.substring(0, 4).toUpperCase();
                let res = null;
                if (otp) {
                    res = {status: 200, message: 'OTP: ' + otp};
                } else {
                    res = {status: 500, message: 'failed to generate OTP'};
                }

                return new Promise((resolve, reject) => {
                    setTimeout(() => resolve(res), 5000);
                });
            }
        },
        reject: {
            cache: false,
            handler(ctx) {
                return new Promise((resolve, reject) => {
                    setTimeout(() => resolve("Whoops!"), 7000);
                });
            }
        },
        commonRecommendation(ctx) {
            return Promise.resolve('------------------------failed');
        }
    },
    methods: {
        getCachedResult(ctx, err) {
            return "Some cached result";
        }
    }
});

broker.start();

