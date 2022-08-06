const express = require("express");
const fs = require('fs');
const shelljs = require('shelljs');
const qrcode = require('qrcode-terminal');
const { Client, MessageMedia } = require('whatsapp-web.js');
const cors = require('cors');
const system = require('system-commands');
const config = require('./config.json');
const paymentService = require("./services/paymentService");
const Payment = require("./models/paymentModel");
const initConnection = require('./config/config');
const { Paynow } = require("paynow");
const axios = require('axios');
const mongoWorker = require('./services/workerService.js');
const beliveEducationService = require("./services/believeEducationService.js");
const { url } = require("inspector");
const reviewsModel = require("./models/reviewsModel");
const portfolioModel = require("./models/workdoneModel");
const QGenerator = require('./services/qGenerator');
const StockGenerator = require('./services/stockGenerator');
const firebase = require("./services/firebase");
const Worker = require('./models/workerModel.js');
const Review = require('./models/reviewsModel.js');
const answerModel = require("./models/answerModel");
const stockModel = require("./models/stockModel");
const stockService = require("./services/stockService");
var ua = require('universal-analytics');


initConnection();


process.title = "whatsapp-node-api";
const client = new Client({ qrTimeoutMs: 0, puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--unhandled-rejections=strict'] } });
///
global.authed = false;
const app = express();







const port = process.env.PORT || config.port;
//Set Request Size Limit 50 MB

client.initialize();

client.on('qr', qr => {
    // console.log("initialize QR")
    qrcode.generate(qr, { small: true });
    fs.writeFileSync('./components/last.qr', qr);
});



client.on('authenticated', (session) => {
    console.log("AUTH HAS WORKED!");
    // sessionCfg = session;
    // fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function(err) {
    //     if (err) {
    //         console.error(err);
    //     }
    //     authed=true;
    // });
    // try{
    //     fs.unlinkSync('./components/last.qr')
    // }catch(err){}
});

client.on('auth_failure', () => {
    console.log("AUTH Failed !")
    sessionCfg = ""
    process.exit()
});


var messageChain = new Map();
var invoice = new Date().getTime().toString();
const zwlPrice = 600;
var pollUrl = "";
var seenProfilesMap = new Map();
var clientMap = new Map();
var pdfMap = new Map();
var attachmentData = {};
const contactUs = "263719066282";
const hiveBot = "263713020524";



client.on('ready', async () => {
    console.log('Hive is running!');
    // getAllPeopleWhoMessagedUs();


    // let workers = await mongoWorker.getAllWorkers();
    // workers.forEach((e) => {
    //     if (typeof e.expired === "undefined") {
    //         mongoWorker.updateAllOther(e.no).catch(console.error);
    //     }
    // });
    try {
        const chats = await client.getChats();


        chats.forEach((chat) => {
            if (chat.unreadCount > 0) {
                chat.fetchMessages({ limit: chat.unreadCount }).then((unreadMessages) => {
                    let query = unreadMessages[0].body;
                    let no = chat.id._serialized;
                    let name = "";
                    let messages = [];


                    if (query.substring(query.indexOf("@"), query.length).toLowerCase() === "@va" && query.includes("@va") && query.substring(0, query.indexOf("@va")) !== "add") { // Virtual Assistant channel
                        let businessName = query.toLowerCase().substring(0, query.toLowerCase().indexOf("@va"));

                        mongoWorker.checkName(businessName).then((r) => {
                            var timeOfDay = "";
                            if (new Date().getHours() < 12) {
                                timeOfDay = "Morning";
                            } else if (new Date().getHours() > 12 && new Date().getHours() < 16) {
                                timeOfDay = "Afternoon";
                            } else {
                                timeOfDay = "Day";
                            }
                            if (r === null) {
                                messageToSend = `Pleasant ${timeOfDay}, it appears that Virtual Assistant is no longer operational, kindly contact the person who gave you the link to find out if it is still operational`;

                            } else {
                                clientMap.set(no, r);
                                messages.push(query);
                                messageChain.set(no, messages);
                                if (businessName.toLowerCase().replace(/\s/g, '') === "believeeducation") {
                                    let options = {
                                        unsafeMime: true,
                                    }
                                    return MessageMedia.fromUrl(r.pic, options).then((media) => {
                                        var mess = "Welcome to Believe Eduaction, please send through your question";
                                        client.sendMessage(msg.from, media, { caption: mess }).catch(console.error);
                                    }).catch(console.error);

                                } else {
                                    messageToSend = `Pleasant ${timeOfDay} ${r.name}, welcome to ${businessName}'s Virtual Assistant \n\n \n*1* About ${businessName} \n*2* See services \n*3* Frequently asked questons   \n\nSend the number of the option you want, e.g send 2 if you want to see ${businessName}'s services`;
                                }


                            }
                            client.sendMessage(no, messageToSend).then((res) => {

                            }).catch(console.error);
                        }).catch(console.error);



                    } else if (query === "#") { // Restart coversation
                        messageToSend = "You have restarted.\nType hi message to continue or click link below \nhttps://wa.me/263713020524?text=hie";

                        client.sendMessage(no, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch((e) => {
                            console.error(e);
                            messageToSend = "Oooops looks like there was an error, please try again, by sending a new message ";

                            client.sendMessage(no, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch((console.error));
                        });
                    } else if (query.substring(query.indexOf('@') + 1, query.length) === "profile" && query.substring(0, query.indexOf('@')).length === 13) { // See Profile
                        // See profile

                        var id = query.substring(0, query.indexOf('@'));
                        mongoWorker.getWorkerById(id).then((v) => {
                            let website = "";
                            if (v.package === "7.99") {
                                website = `_Website_: ${v.url}`;
                            }
                            messageToSend = `_Name_: ${v.name} \n_Brief Intro_:${v.brief} \n_Services_: ${v.skills} \n_Areas able to serve_: ${v.areas} \nTo chat to their Chatbot(Virtual Assistant) click \nhttps://wa.me/263713020524?text=${v.urlName}@va   ${website} \n_Contact_: https://wa.me/${v.no.substring(0, v.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Hive+I+am+interested+in+your+services`;
                            client.sendMessage(no, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);

                        }).catch((e) => {
                            console.log(e);
                            messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";

                            client.sendMessage(no, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);
                        });
                    } else if (query.toLowerCase() === "subscribe") { // subscribe to service

                        messages.push(query);
                        messageChain.set(no, messages);
                        messageToSend = "Please select the package you would like to subscribe to \n\n \n*1* Gold Package 7.99USD p.m (Profile , Virtual Assistant and Web page)  \n*2* Platinum Package (Custom solution to improve your services)  \n\nTo choose any option send a number eng. 1 to get pay for a Profile, Virtual Assistant and a Web page \n\nTerms and Conditions Apply, to see them send Terms or click this link https://wa.me/263713020524?text=terms";

                        client.sendMessage(no, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch((console.error));
                    } else if (query.toLowerCase() === "terms") { // See Terms

                        var mediaMessage = "Hive Terms and Conditions";
                        const media = MessageMedia.fromFilePath('./t&cs.pdf');

                        client.sendMessage(no, media, { caption: mediaMessage }).catch(console.error);
                        client.sendMessage(no, mediaMessage).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch((console.error));
                    } else if (query.substring(query.indexOf('@') + 1, query.length) === "portfolio" && query.includes("@portfolio")) { // See portfolio

                        mongoWorker.getWorker(no).then((v) => {
                            if (v === null) {

                                messageToSend = "It appears this user is yet to create an account, only registered people can add their portfolio pictures";
                            } else {
                                messages.push(query);
                                messageChain.set(no, messages);
                                clientMap.set(no, v);
                                messageToSend = "You want to add to your portfolio which showcases the work you have done, great, we take one picture per description, we advise you to post *only the best pictures*";
                            }
                            client.sendMessage(no, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch((console.error));
                        }).catch(console.error);
                    } else if (query.substring(query.indexOf('@') + 1, query.length) === "pic") {

                        mongoWorker.getWorker(no).then((v) => {
                            if (v === null) {

                                messageToSend = "It appears this user is yet to create an account, only registered people can add their profile pictures";
                            } else {
                                messages.push(query);
                                messageChain.set(no, messages);
                                clientMap.set(no, v);
                                messageToSend = "You want to add your picture, great, send your picture now";
                            }
                            client.sendMessage(no, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch((console.error));
                        }).catch(console.error);

                    } else if (query.substring(query.indexOf('@') + 1, query.length) === "rate" && query.includes("@rate")) { // rate or put recommendations

                        let username = query.substring(0, query.indexOf('@'));
                        mongoWorker.checkName(username).then((v) => {

                            if (v === null) {
                                messageToSend += `We do not appear to have this user in our database, please ask them again, and try again`;
                            } else {
                                messages.push(query.toLowerCase());
                                messageChain.set(no, messages);
                                messageToSend += `Thank you for rating the service you got, on a scale of 1 to 5, how would you rate the service you got, you can only type a number between 1 and 5`;
                            }
                            client.sendMessage(no, messageToSend).then((res) => {

                            }).catch(console.error);

                        }).catch(console.error);
                    } else if (query.toLowerCase() === "addva") {

                        mongoWorker.getWorker(no).then((v) => {
                            if (v === null) {
                                messageToSend = `It appears you are yet to create an account, create an account today, by selecting option 2, on the welcome message, send any message now to get to the main page`;

                            } else {
                                clientMap.set(no, v);
                                messages.push(query.toLowerCase());
                                messageChain.set(no, messages);
                                messageToSend = `Add your Chatbot(Virtual Assistant) \nPlease list all your services and the price for each separated by a semicolon in this format descr=amount and send them, all the you services listed above \ne.g website deveopmen=100USD; Mobile Application development=300USD \nOR \nMoving goods local(in town)=10USD;Moving goods above 2T=45USD \nOR \nPedicure=7USD,Manicure=10USD \n\nIf you need to Edit your Chatbot (Virtual Assistant) click this link https://wa.me/${hiveBot}?text=addva`;
                            }
                            client.sendMessage(no, messageToSend).then((res) => {

                            }).catch(console.error);
                        }).catch(console.error);
                    } else if (query.toLowerCase() === "@update") {

                        mongoWorker.getWorker(no).then((v) => {
                            if (v === null) {
                                messageToSend = `It appears you are yet to create an account, create an account today, by selecting option 2, on the welcome message, send any message now to get to the main page`;

                            } else {
                                clientMap.set(no, v);
                                messages.push(query.toLowerCase());
                                messageChain.set(no, messages);
                                messageToSend = `Hie ${v.name} , you want to update your account, you can not change your name, however you can update on other things, for your Chatbot(Virtual Assistant) click this link to update it https://wa.me/263713020524?text=addva \n\nPlease type your updated intro about yourself`;
                            }
                            client.sendMessage(no, messageToSend).then((res) => {

                            }).catch(console.error);
                        }).catch(console.error);
                    } else if (query.toLowerCase() === "believeeducation@add") { // Believe education auth and ask for info

                        mongoWorker.getWorker(no).then((v) => {
                            if (v.urlName === "lionelchidzivabelieveeducationpvtltd") {
                                clientMap.set(no, v);
                                messages.push(query.toLowerCase());
                                messageChain.set(no, messages);
                                messageToSend = `Hie ${v.name} , you are about to add information for your students, please answer the next few questions. Please type the information your want to add e.g `;
                            } else {
                                messageToSend = `You do not have access to add information to this account`;

                            }
                            client.sendMessage(no, messageToSend).then((res) => {

                            }).catch(console.error);
                        }).catch(console.error);
                    } else {

                        // user has not communicated yet, welcome them

                        messages.push("1073unashe");
                        messageChain.set(no, messages);
                        var timeOfDay = "";
                        if (new Date().getHours() < 12) {
                            timeOfDay = "Morning";
                        } else if (new Date().getHours() > 12 && new Date().getHours() < 16) {
                            timeOfDay = "Afternoon";
                        } else {
                            timeOfDay = "Day";
                        }

                        messageToSend = `Pleasant ${timeOfDay}, welcome to Hive \n\n \n*1* Search for a service \n*2* Register \n*3* How does this work?   \n\nSend the number of the option you want, e.g send 2 if you want to register as a service provider`;

                        client.sendMessage(no, messageToSend).then((res) => {

                        }).catch(console.error);



                    }






                }).catch(console.error);
            }

        });
    } catch (error) {
        console.error(error);
    }


});



client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});





client.on('message', async msg => {






    // Check for media
    if (msg.hasMedia) {

        attachmentData = await msg.downloadMedia();
        // for (let index = 0; index < 10; index++) {
        //     // const media = MessageMedia.fromFilePath(`./Quotation 1234.pdf`);
        //     client.sendMessage(msg.from, attachmentData, { caption: "Test Document" }).catch(console.error);
        // }
    }










    /// A unique identifier for the given session
    // const sessionId = randomString({ length: 20 });
    const query = msg.body;
    const no = msg.from;

    // Initialise visitor analytics
    var visitor = ua('UA-203224382-1', no, { strictCidFormat: false });



    const user = await msg.getContact();

    var name = user.pushname + "!";
    if (name === undefined || name === Object.keys(user).length === 0) {
        name = "";
    }


    // array message
    var messageToSend = "";
    var messages = [];




    if (msg.from.length < 23 && msg.from.includes("@c")) {



        if (query.substring(query.indexOf("@"), query.length).toLowerCase() === "@va" && query.includes("@va") && query.substring(0, query.indexOf("@va")) !== "add") { // Virtual Assistant channel
            messageChain.delete(no);
            let businessName = query.toLowerCase().substring(0, query.toLowerCase().indexOf("@va"))


            mongoWorker.checkName(businessName).then((r) => {


                if (r === null) {
                    messageToSend = `Hi there ${name}!, it appears that Virtual Assistant is no longer operational, kindly contact the person who gave you the link to find out if it is still operational`;
                    client.sendMessage(msg.from, messageToSend).then((res) => {
                        visitor.pageview(`/va/404`, function (err) {
                            if (err) {
                                console.error(err);
                            }
                            // Handle the error if necessary.
                            // In case no error is provided you can be sure
                            // the request was successfully sent off to Google.
                        });
                    }).catch(console.error);
                } else {
                    clientMap.set(no, r);
                    messages.push(query);
                    messageChain.set(no, messages);
                    if (businessName.toLowerCase().replace(/\s/g, '') === "believeeducation") {
                        let options = {
                            unsafeMime: true,
                        }
                        return MessageMedia.fromUrl(r.pic, options).then((media) => {
                            var mess = "Welcome to Believe Eduaction, please send through your question";
                            client.sendMessage(msg.from, media, { caption: mess }).then((r) => {
                                visitor.pageview(`/va/believeeducation`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            }).catch(console.error);
                        }).catch(console.error);

                    } else {

                        messageToSend = `Hi there ${name}!, welcome to ${businessName}'s Virtual Assistant \n\n \n*1* About ${businessName} \n*2* See services \n*3* Frequently asked questons   \n\nSend the number of the option you want, e.g send 2 if you want to see ${businessName}'s services`;
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            visitor.pageview(`/va/${businessName}`, function (err) {
                                if (err) {
                                    console.error(err);
                                }
                                // Handle the error if necessary.
                                // In case no error is provided you can be sure
                                // the request was successfully sent off to Google.
                            });
                        }).catch(console.error);
                    }


                }

            }).catch(console.error);




        } else if (query === "#") { // Restart coversation
            messageToSend = "You have restarted.\nType hi message to continue or click link below \nhttps://wa.me/263713020524?text=hie";
            messageChain.delete(no);

            client.sendMessage(msg.from, messageToSend).then((res) => {
                // console.log("Res " + JSON.stringify(res));
                visitor.pageview(`/restart`, function (err) {
                    if (err) {
                        console.error(err);
                    }
                    // Handle the error if necessary.
                    // In case no error is provided you can be sure
                    // the request was successfully sent off to Google.
                });
            }).catch((e) => {
                console.error(e);
                messageToSend = "Oooops looks like there was an error, please try again, by sending a new message ";

                client.sendMessage(msg.from, messageToSend).then((res) => {
                    // console.log("Res " + JSON.stringify(res));
                }).catch((console.error));
            });
        } else if (query.substring(query.indexOf('@') + 1, query.length) === "profile" && query.substring(0, query.indexOf('@')).length === 13 || query.toLocaleLowerCase() === "@profile") { // See Profile

            // See profile
            messageChain.delete(no);

            if (query.toLocaleLowerCase() === "@profile") {
                mongoWorker.getWorker(no).then((v) => {

                    if (typeof v.urlName === "undefined") {
                        messageToSend = `_Name_: ${v.name} \n_Brief Intro_:${v.brief} \n_Services_: ${v.skills} \n_Areas able to serve_: ${v.areas}`;
                        client.sendMessage(msg.from, messageToSend).then((v) => {
                            visitor.pageview(`/profile/${v.name}`, function (err) {
                                if (err) {
                                    console.error(err);
                                }
                                // Handle the error if necessary.
                                // In case no error is provided you can be sure
                                // the request was successfully sent off to Google.
                            });
                        }).catch(console.error);
                    } else {
                        let website = "";
                        if (v.package === "7.99") {
                            website = `_Website_: ${v.url}`;
                        }
                        let options = {
                            unsafeMime: true,
                        }

                        if (typeof v.pic === "undefined") {
                            messageToSend = `_Name_: ${v.name} \n_Brief Intro_:${v.brief} \n_Services_: ${v.skills} \n_Areas able to serve_: ${v.areas} \nTo chat to their Chatbot(Virtual Assistant) click \nhttps://wa.me/263713020524?text=${v.urlName}@va   \n${website}`;
                            client.sendMessage(msg.from, messageToSend).then((v) => {
                                visitor.pageview(`/profile/${v.name}`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            }).catch(console.error);
                        } else {
                            return MessageMedia.fromUrl(v.pic, options).then((media) => {
                                messageToSend = `_Name_: ${v.name} \n_Brief Intro_:${v.brief} \n_Services_: ${v.skills} \n_Areas able to serve_: ${v.areas} \nTo chat to their Chatbot(Virtual Assistant) click \nhttps://wa.me/263713020524?text=${v.urlName}@va   \n${website}`;
                                client.sendMessage(msg.from, media, { caption: messageToSend }).then((v) => {
                                    visitor.pageview(`/profile/media/${v.name}`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch(console.error);
                            }).catch(console.error);
                        }
                    }

                }).catch(console.error);
            } else {
                var id = query.substring(0, query.indexOf('@'));
                mongoWorker.getWorkerById(id).then((v) => {

                    if (typeof v.urlName === "undefined") {
                        mongoWorker.removeBids(v.bids, v.no).catch(console.error);
                        messageToSend = `_Name_: ${v.name} \n_Brief Intro_:${v.brief} \n_Services_: ${v.skills} \n_Areas able to serve_: ${v.areas} \n_Contact_: https://wa.me/${v.no.substring(0, v.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Hive+I+am+interested+in+your+services`;
                        client.sendMessage(msg.from, messageToSend).catch(console.error);

                        let mess = `Number ending ${no.substring(no.indexOf("@c.us") - 3, no.indexOf("@c.us"))} just viewed your profile`;
                        client.sendMessage(v.no, mess).catch(console.error);

                    } else {
                        let website = "";
                        if (v.package === "7.99") {
                            website = `_Website_: ${v.url}`;
                        }
                        let options = {
                            unsafeMime: true,
                        }

                        if (typeof v.pic === "undefined") {
                            messageToSend = `_Name_: ${v.name} \n_Brief Intro_:${v.brief} \n_Services_: ${v.skills} \n_Areas able to serve_: ${v.areas} \nTo chat to their Chatbot(Virtual Assistant) click \nhttps://wa.me/263713020524?text=${v.urlName}@va   \n${website} \n_Contact_: https://wa.me/${v.no.substring(0, v.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Hive+I+am+interested+in+your+services`;
                            client.sendMessage(msg.from, messageToSend).catch(console.error);

                            let mess = `Number ending ${no.substring(no.indexOf("@c.us") - 3, no.indexOf("@c.us"))} just viewed your profile`;
                            client.sendMessage(v.no, mess).catch(console.error);
                        } else {

                            let mess = `Number ending ${no.substring(no.indexOf("@c.us") - 3, no.indexOf("@c.us"))} just viewed your profile`;
                            client.sendMessage(v.no, mess).catch(console.error);

                            return MessageMedia.fromUrl(v.pic, options).then((media) => {
                                messageToSend = `_Name_: ${v.name} \n_Brief Intro_:${v.brief} \n_Services_: ${v.skills} \n_Areas able to serve_: ${v.areas} \nTo chat to their Chatbot(Virtual Assistant) click \nhttps://wa.me/263713020524?text=${v.urlName}@va   \n${website} \n_Contact_: https://wa.me/${v.no.substring(0, v.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Hive+I+am+interested+in+your+services`;
                                client.sendMessage(msg.from, media, { caption: messageToSend }).catch(console.error);
                            }).catch(console.error);
                        }
                    }







                }).catch((e) => {
                    console.log(e);
                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";

                    client.sendMessage(msg.from, messageToSend).then((res) => {
                        // console.log("Res " + JSON.stringify(res));
                    }).catch(console.error);
                });
            }


        } else if (query.toLowerCase() === "@subscribe") { // subscribe to service
            messageChain.delete(no); //Ensure all previous messages are deleted
            messages.push(query);
            messageChain.set(no, messages);
            messageToSend = "Please select the package you would like to subscribe to \n\n \n*1* Gold Package 7.99USD p.m (Profile , Virtual Assistant and Web page)  \n*2* Platinum Package (Custom solution to improve your services)  \n\nTo choose any option send a number eng. 1 to get pay for a Profile, Virtual Assistant and a Web page \n\nTerms and Conditions Apply, to see them send Terms or click this link https://wa.me/263713020524?text=terms";

            client.sendMessage(msg.from, messageToSend).then((res) => {
                // console.log("Res " + JSON.stringify(res));
                visitor.pageview(`/subscribe/initialize`, function (err) {
                    if (err) {
                        console.error(err);
                    }
                    // Handle the error if necessary.
                    // In case no error is provided you can be sure
                    // the request was successfully sent off to Google.
                });
            }).catch((console.error));
        } else if (query.toLowerCase() === "@terms") { // See Terms
            messageChain.delete(no);
            var mediaMessage = "Hive Terms and Conditions";
            const media = MessageMedia.fromFilePath('./t&cs.pdf');
            messageChain.delete(no);
            client.sendMessage(no, media, { caption: mediaMessage }).catch(console.error);
            client.sendMessage(msg.from, mediaMessage).then((res) => {
                // console.log("Res " + JSON.stringify(res));
                visitor.pageview(`/terms`, function (err) {
                    if (err) {
                        console.error(err);
                    }
                    // Handle the error if necessary.
                    // In case no error is provided you can be sure
                    // the request was successfully sent off to Google.
                });
            }).catch((console.error));
        } else if (query.substring(query.indexOf('@') + 1, query.length) === "portfolio" && query.includes("@portfolio")) { // See portfolio
            messageChain.delete(no);
            mongoWorker.getWorker(no).then((v) => {
                if (v === null) {
                    messageChain.delete(no);
                    messageToSend = "It appears this user is yet to create an account, only registered people can add their portfolio pictures";
                } else {
                    messages.push(query);
                    messageChain.set(no, messages);
                    clientMap.set(no, v);
                    messageToSend = "You want to add to your portfolio which showcases the work you have done, great, we take one picture per description, we advise you to post *only the best pictures*";
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    // console.log("Res " + JSON.stringify(res));
                    visitor.pageview(`/addportfolio/initialize`, function (err) {
                        if (err) {
                            console.error(err);
                        }
                        // Handle the error if necessary.
                        // In case no error is provided you can be sure
                        // the request was successfully sent off to Google.
                    });
                }).catch((console.error));
            }).catch(console.error);
        } else if (query.substring(query.indexOf('@') + 1, query.length) === "pic") {
            messageChain.delete(no);
            mongoWorker.getWorker(no).then((v) => {
                if (v === null) {
                    messageChain.delete(no);
                    messageToSend = "It appears this user is yet to create an account, only registered people can add their profile pictures";
                } else {
                    messages.push(query);
                    messageChain.set(no, messages);
                    clientMap.set(no, v);
                    messageToSend = "You want to add your picture, great, send your picture now";
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    // console.log("Res " + JSON.stringify(res));
                    visitor.pageview(`/addpic/initialize`, function (err) {
                        if (err) {
                            console.error(err);
                        }
                        // Handle the error if necessary.
                        // In case no error is provided you can be sure
                        // the request was successfully sent off to Google.
                    });
                }).catch((console.error));
            }).catch(console.error);

        } else if (query.substring(query.indexOf('@') + 1, query.length) === "rate" && query.includes("@rate")) { // rate or put recommendations
            messageChain.delete(no);
            let username = query.substring(0, query.indexOf('@'));
            mongoWorker.checkName(username).then((v) => {

                if (v === null) {
                    messageToSend += `We do not appear to have this user in our database, please ask them again, and try again`;
                } else {
                    messages.push(query.toLowerCase());
                    messageChain.set(no, messages);
                    messageToSend += `Thank you for rating the service you got, on a scale of 1 to 5, how would you rate the service you got, you can only type a number between 1 and 5`;
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    visitor.pageview(`/rate/${v.name}`, function (err) {
                        if (err) {
                            console.error(err);
                        }
                        // Handle the error if necessary.
                        // In case no error is provided you can be sure
                        // the request was successfully sent off to Google.
                    });
                }).catch(console.error);

            }).catch(console.error);
        } else if (query.toLowerCase() === "addva") {
            messageChain.delete(no);
            mongoWorker.getWorker(no).then((v) => {
                if (v === null) {
                    messageToSend = `It appears you are yet to create an account, create an account today, by selecting option 2, on the welcome message, send any message now to get to the main page`;
                    messageChain.delete(no);
                } else {
                    clientMap.set(no, v);
                    messages.push(query.toLowerCase());
                    messageChain.set(no, messages);
                    messageToSend = `Add your Chatbot(Virtual Assistant) \nPlease list all your services and the price for each separated by a semicolon in this format descr=amount and send them, all the you services listed above \ne.g website deveopmen=100USD; Mobile Application development=300USD \nOR \nMoving goods local(in town)=10USD;Moving goods above 2T=45USD \nOR \nPedicure=7USD,Manicure=10USD \n\nIf you need to Edit your Chatbot (Virtual Assistant) click this link https://wa.me/${hiveBot}?text=addva`;
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    visitor.pageview(`/addva/initialize`, function (err) {
                        if (err) {
                            console.error(err);
                        }
                        // Handle the error if necessary.
                        // In case no error is provided you can be sure
                        // the request was successfully sent off to Google.
                    });
                }).catch(console.error);
            }).catch(console.error);
        } else if (query.toLowerCase() === "@update") {
            messageChain.delete(no);
            mongoWorker.getWorker(no).then((v) => {
                if (v === null) {
                    messageToSend = `It appears you are yet to create an account, create an account today, by selecting option 2, on the welcome message, send any message now to get to the main page`;
                    messageChain.delete(no);
                } else {
                    clientMap.set(no, v);
                    messages.push(query.toLowerCase());
                    messageChain.set(no, messages);
                    messageToSend = `Hie ${v.name} , you want to update your account, you can not change your name, however you can update on other things, for your Chatbot(Virtual Assistant) click this link to update it https://wa.me/263713020524?text=addva \n\nPlease type your updated intro about yourself`;
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    visitor.pageview(`/updateaccount/initialize/${v.name}`, function (err) {
                        if (err) {
                            console.error(err);
                        }
                        // Handle the error if necessary.
                        // In case no error is provided you can be sure
                        // the request was successfully sent off to Google.
                    });
                }).catch(console.error);
            }).catch(console.error);
        } else if (query.toLowerCase() === "believeeducation@add") { // Believe education auth and ask for info
            messageChain.delete(no);
            mongoWorker.getWorker(no).then((v) => {
                if (v.urlName === "believeeducation") {
                    clientMap.set(no, v);
                    messages.push(query.toLowerCase());
                    messageChain.set(no, messages);
                    messageToSend = `Hie ${v.name} , you are about to add information for your students, please answer the next few questions. Please type the information your want to add e.g `;
                } else {
                    messageToSend = `You do not have access to add information to this account`;
                    messageChain.delete(no);
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    visitor.pageview(`/believeeducationadd/initialize`, function (err) {
                        if (err) {
                            console.error(err);
                        }
                        // Handle the error if necessary.
                        // In case no error is provided you can be sure
                        // the request was successfully sent off to Google.
                    });
                }).catch(console.error);
            }).catch(console.error);
        } else if (query.toLowerCase() === "@instructions") {
            messageChain.delete(no);
            mongoWorker.getWorker(no).then((v) => {
                if (typeof v.package === "0" || typeof v.package === "undefined") {
                    messageToSend = `Hie ${v.name} , here are some important keywords you can take advantage of \n\nkeyword @profile to see your profile \n\nkeyword @update to update your account \n\nkeyword @terms to see Hive Terms and Conditions`;
                } else {
                    messageToSend = `Hie ${v.name} , here are the options you have as a business account holder, use these keywords to help you use your Hive account to its fullest potential \n\nkeyword @services to add your services \n\nkeyword @faq to add frequently asked questions \n\nkeyword @portfolio to add work done before \n\nkeyword @pic to add your main display picture for your hive website \n\nkeyword @update to update your account information \n\nkeyword @subscribe to subscribe  \n\nkeyword @profile to see your profile`;
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    visitor.pageview(`/instructions/${v.name}`, function (err) {
                        if (err) {
                            console.error(err);
                        }
                        // Handle the error if necessary.
                        // In case no error is provided you can be sure
                        // the request was successfully sent off to Google.
                    });
                }).catch(console.error);
            }).catch(console.error);
        } else if (query.toLowerCase() === "@service") {
            messageChain.delete(no);
            mongoWorker.getWorker(no).then((v) => {
                if (typeof v.urlName === "undefined" || v.expired) {

                    if (v.expired) {
                        messageToSend = `Your account expired, please renew to continue enjoying the full benefits https://wa.me/${hiveBot}?text=@subscribe`;
                    } else {
                        messageToSend = `Only businesses can add services with prices `;
                    }


                } else {
                    messages.push(query);
                    messageChain.set(no, messages);
                    messageToSend = `Hie ${v.name} , please send a description of the service(only one service at a time) e.g website development `;
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    visitor.pageview(`/addservice/${v.name}`, function (err) {
                        if (err) {
                            console.error(err);
                        }
                        // Handle the error if necessary.
                        // In case no error is provided you can be sure
                        // the request was successfully sent off to Google.
                    });
                }).catch(console.error);
            }).catch(console.error);

        } else if (query.toLowerCase() === "@faq") {
            messageChain.delete(no);
            mongoWorker.getWorker(no).then((v) => {
                if (typeof v.urlName === "undefined" || v.expired) {


                    if (v.expired) {
                        messageToSend = `Your account expired, please renew to continue enjoying the full benefits https://wa.me/${hiveBot}?text=@subscribe`;
                    } else {
                        messageToSend = `Only businesses can add frequently asked questions`;
                    }

                } else {
                    messages.push(query);
                    messageChain.set(no, messages);
                    messageToSend = `Hie ${v.name} , Please send one question people ask a lot, pretend you are the customer asking the question, *remember to add the question mark* e.g How long does it take to get the work done?`;
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    visitor.pageview(`/addfaq/${v.name}`, function (err) {
                        if (err) {
                            console.error(err);
                        }
                        // Handle the error if necessary.
                        // In case no error is provided you can be sure
                        // the request was successfully sent off to Google.
                    });
                }).catch(console.error);
            }).catch(console.error);
        } else if (query.toLowerCase() === "@addstock") { // Add stock name
            messageChain.delete(no);
            mongoWorker.getWorker(no).then((v) => {
                if (typeof v.urlName === "undefined" || v.expired) {

                    if (v.expired) {
                        messageToSend = `Your account expired, please renew to continue enjoying the full benefits https://wa.me/${hiveBot}?text=@subscribe`;
                    } else {
                        messageToSend = `Only businesses can add stock`;
                    }

                } else {
                    messages.push(query);
                    messageChain.set(no, messages);
                    messageToSend = `Hie ${v.name} , You are about to add stock, what is the name of item, \n\nN.B Ensure you put in a name you can remember which you will use to confirm it has been bought`;
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    visitor.pageview(`/addstock/${v.name}`, function (err) {
                        if (err) {
                            console.error(err);
                        }
                        // Handle the error if necessary.
                        // In case no error is provided you can be sure
                        // the request was successfully sent off to Google.
                    });
                }).catch(console.error);
            }).catch(console.error);


        } else if (query.toLowerCase() === "@stock") { // View stock
            messageChain.delete(no);
            stockService.seeAvailableStock(no).then((v) => {
                if (v.length > 0) {

                    messages.push(query);
                    messageChain.set(no, messages);
                    clientMap.set(no, v);
                    messageToSend = `How would you like to see your stock report, \n\n*1* Pdf format(Looks better this way) \n*2* As a normal message`;
                    var stock = {};

                    var uniqueID = new Date().getTime().toString();
                    stock.name = `stock ${uniqueID}`;
                    pdfMap.set(no, uniqueID);

                    stock.dueDate = `${new Date().getMonth() + 1}/${new Date().getDate()}/${new Date().getFullYear()}`;
                    let stockItems = [];
                    let subtotal = 0;
                    for (let index = 0; index < v.length; index++) {

                        stockItems.push({
                            description: v[index].visibleName,
                            quantity: v[index].numberOfItems,
                            price: v[index].itemPrice,
                            amount: v[index].itemPrice * v[index].numberOfItems,
                        });
                        subtotal += (v[index].itemPrice * v[index].numberOfItems);


                    }
                    stock.items = stockItems;
                    stock.subtotal = subtotal;
                    const stockGenerator = new StockGenerator(stock);

                    stockGenerator.generate();
                } else {
                    messageToSend = `It appears you have no stock available`;
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    visitor.pageview(`/seestock/${v.name}`, function (err) {
                        if (err) {
                            console.error(err);
                        }
                        // Handle the error if necessary.
                        // In case no error is provided you can be sure
                        // the request was successfully sent off to Google.
                    });
                }).catch(console.error);
            }).catch(console.error);
        } else if (query.toLowerCase() === "@addstockmember") { // Add someone else to be able to see what is going on 
            messageChain.delete(no);
            stockService.seeAvailableStock(no).then((v) => {
                if (v.length > 0) {
                    clientMap.set(no, v);
                    messages.push(query);
                    messageChain.set(no, messages);
                    messageToSend = `Please send the number of the person you want to add to be able to view the stock in the format 0712345678`;
                } else {
                    messageToSend = `It appears you have no stock available`;
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    visitor.pageview(`/addstockmember/${v.name}`, function (err) {
                        if (err) {
                            console.error(err);
                        }
                        // Handle the error if necessary.
                        // In case no error is provided you can be sure
                        // the request was successfully sent off to Google.
                    });
                }).catch(console.error);
            }).catch(console.error);
        } else if (query.includes("@sold")) { // Confirm sold item keyword laptop@sold12
            messageChain.delete(no);
            let itemName = query.substring(0, query.indexOf("@sold"));
            let numberOfItems = parseInt(query.substring(query.indexOf("@sold") + 5, query.length));
            if (typeof parseInt(numberOfItems) === "number") {

                stockService.removeFromAvailableStock(no, itemName, numberOfItems).then((r) => {
                    if (r.no === no) {
                        messageToSend = "Transation added successfully";
                    } else if (r === null) {
                        messageToSend = "It appears you entered a stock name you do not have please check the spelling again and send, please use the format [item name]@sold[number of items sold] e.g laptop@sold11";
                    } else if (r === 0) {
                        messageToSend = "It appears you entered a stock name that has since finished,Ensure you update if you have new stock ";
                    }
                    client.sendMessage(msg.from, messageToSend).then((res) => {
                        visitor.pageview(`/itemssold`, function (err) {
                            if (err) {
                                console.error(err);
                            }
                            // Handle the error if necessary.
                            // In case no error is provided you can be sure
                            // the request was successfully sent off to Google.
                        });
                    }).catch(console.error);
                }).catch(console.error);

            } else {
                messageToSend = "The number of items sold are not clear, please use the format [item name]@sold[number of items sold] e.g laptop@sold11";
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    visitor.pageview(`/wrongnumberofitemssolds`, function (err) {
                        if (err) {
                            console.error(err);
                        }
                        // Handle the error if necessary.
                        // In case no error is provided you can be sure
                        // the request was successfully sent off to Google.
                    });
                }).catch(console.error);
            }

        } else {

            if (messageChain.has(no)) { // check if user is already in communication
                messages = messageChain.get(no);
                switch (messages.length) { // looking to get the context of the current conversation
                    case 1:
                        if (messages.length > 2) {
                            messageToSend = "Our apology there was a network error, kindly try again, type # to restart";
                            messageChain.delete(no);
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                visitor.pageview(`/networkerror`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            }).catch(console.error);
                        } else {
                            if (messages[0] === "@subscribe") { // @subscribe 

                                if (query === "2") { // Custom software package
                                    messageToSend = "Please send click this link https://wa.me/263772263139?text=Hi+Hive+I+want+a+custom+software+solution+for+my+business";

                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        messageChain.delete(no);
                                        visitor.pageview(`/customsoftwarepackage`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }).catch((console.error));


                                } else { // One of the two packages
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    messageToSend = "Please send the Ecocash number you are using to pay, e.g 0771123123 our system works just like the system in the supermarket, after you put in your phone number it will send you a prompt to pay on your phone";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                        visitor.pageview(`/subscribesendnumber`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }).catch((console.error));
                                }
                            } else if (messages[0].substring(messages[0].indexOf("@"), messages[0].length).toLowerCase() === "@va" && messages[0].includes("@va")) {

                                let v = clientMap.get(no);
                                if (v.urlName === "believeeducation") {
                                    beliveEducationService.getAnswer(query).then((r) => {
                                        let mess = "";
                                        if (r.primary) {
                                            r.results.forEach(element => {
                                                mess += `${element.info} \n\n`;
                                            });
                                        } else {
                                            let messageToLio = `We could not find an answer to a student who asked this question, please check it out and add the answer if possible \n\n${query}`;
                                            client.sendMessage(v.no, messageToLio).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                                visitor.pageview(`/believeeducationanswernotfound`, function (err) {
                                                    if (err) {
                                                        console.error(err);
                                                    }
                                                    // Handle the error if necessary.
                                                    // In case no error is provided you can be sure
                                                    // the request was successfully sent off to Google.
                                                });
                                            }).catch((console.error));
                                            mess += "*We could not immediately find the answer to your question but here is some cool info*\n\n";
                                            r.results.forEach(element => {
                                                mess += `${element.info} \n\nSend # to restart`;
                                            });
                                        }
                                        if (typeof r.results[0].imageUrl === "undefined") {
                                            client.sendMessage(msg.from, mess).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                                visitor.pageview(`/believeeducationanswerwithoutimage`, function (err) {
                                                    if (err) {
                                                        console.error(err);
                                                    }
                                                    // Handle the error if necessary.
                                                    // In case no error is provided you can be sure
                                                    // the request was successfully sent off to Google.
                                                });
                                            }).catch((console.error));

                                        } else {
                                            let options = {
                                                unsafeMime: true,
                                            }
                                            return MessageMedia.fromUrl(r.results[0].imageUrl, options).then((media) => {
                                                client.sendMessage(msg.from, media, { caption: mess }).then((v) => {
                                                    visitor.pageview(`/believeeducationanswerwithimage`, function (err) {
                                                        if (err) {
                                                            console.error(err);
                                                        }
                                                        // Handle the error if necessary.
                                                        // In case no error is provided you can be sure
                                                        // the request was successfully sent off to Google.
                                                    });
                                                }).catch(console.error);
                                            }).catch(console.error);
                                        }



                                    });

                                } else if (query === "1") { // About
                                    let website = `${v.name}.hive.co.zw`;
                                    messageToSend = `Name: ${v.name} \nBrief Intro:${v.brief} \nServices: ${v.skills} \nAreas able to serve: ${v.areas} \nTo chat to their virtual assistant click \nhttps://wa.me/263713020524?text=${v.name}@va   ${website} \n_Contact_: https://wa.me/${v.no.substring(0, v.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Hive+I+am+interested+in+your+services`;
                                    messageChain.delete(no);
                                    visitor.pageview(`/va/about/${v.name}`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else if (query === "2") { // Services 
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    let servicesPrices = v.prices.split(";");
                                    messageToSend = `${v.name}'s Services and costs \n\n`;
                                    for (let index = 0; index < servicesPrices.length; index++) {
                                        const element = servicesPrices[index];
                                        messageToSend += `${index + 1} ${element.substring(0, element.indexOf("="))}  ${element.substring(element.indexOf("=") + 1, element.length)}\n\n`;
                                    }
                                    messageToSend += `____________END___________\n`;
                                    messageToSend += `Select one of the options below  \n*1* Create a quotation \n*2* See work done before  \n*3* To see reviews \n_Contact_: https://wa.me/${v.no.substring(0, v.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Hive+I+am+interested+in+your+services`;
                                    visitor.pageview(`/va/servicesandcosts/${v.name}`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else if (query === "3") { // FAQs
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    let servicesFAQS = v.faqs.split(";");
                                    messageToSend = `Frequently Asked Questions \n\n`;
                                    for (let index = 0; index < servicesFAQS.length; index++) {
                                        const element = servicesFAQS[index];
                                        messageToSend += `*${index + 1}* ${element.substring(0, element.indexOf("="))}\n\n`;
                                    }
                                    messageToSend += `____________END___________\n`;
                                    messageToSend += `Send the question you are looking an answer for by the sending the number on the left of it e.g 1 \n_Contact_: https://wa.me/${v.no.substring(0, v.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Hive+I+am+interested+in+your+services`;
                                    visitor.pageview(`/va/faqs/${v.name}`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else {
                                    messageToSend = "This response is out of the expected one, please select one of the options 1 or 2 or 3 , if this is not what you type # to restart";
                                    visitor.pageview(`/va/notexpected`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));

                                }).catch((console.error));
                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length) === "rate" && messages[0].includes("@rate")) {
                                if (typeof parseInt(query) === "number") {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    messageToSend = "Thank you sending in your rating, can you type briefly about your experience with this service";
                                    visitor.pageview(`/rate/ratingsent`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else {
                                    messageToSend = "It appears you have put in a number that is not between 1 and 5, please only enter a number between those numbers";
                                    visitor.pageview(`/rate/wrongnumber`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {

                                }).catch(console.error);
                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length) === "pic") {
                                let businessName = clientMap.get(no).name;
                                if (msg.hasMedia) {
                                    return firebase.addImage(businessName, attachmentData.data, "pic").then((r) => {

                                        if (r === null) {
                                            messageToSend = `There was an error adding your display picture please try again, if the problem persists try again later, https://wa.me/${hiveBot}?text=@pic`;
                                            messageChain.delete(no);
                                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                                visitor.pageview(`/addpric/ERROR`, function (err) {
                                                    if (err) {
                                                        console.error(err);
                                                    }
                                                    // Handle the error if necessary.
                                                    // In case no error is provided you can be sure
                                                    // the request was successfully sent off to Google.
                                                });
                                            }).catch(console.error);
                                        } else {
                                            return mongoWorker.addPicture(no, r).then((r) => {
                                                //TODO check is was added successfully
                                                messageToSend = `Your display picture was added successfully, if you want to change it, you can do so by clicking https://wa.me/${hiveBot}?text=@pic`;
                                                messageChain.delete(no);
                                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                                    visitor.pageview(`/addpic/successful`, function (err) {
                                                        if (err) {
                                                            console.error(err);
                                                        }
                                                        // Handle the error if necessary.
                                                        // In case no error is provided you can be sure
                                                        // the request was successfully sent off to Google.
                                                    });
                                                }).catch(console.error);
                                            }).catch(console.error);
                                        }


                                    }).catch(console.error);
                                } else {
                                    messageToSend = `It appears the picture was not downloaded properly please send the picture again`;
                                    messageChain.delete(no);
                                    client.sendMessage(msg.from, messageToSend).then((res) => {

                                    }).catch(console.error)
                                }





                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length) === "portfolio" && messages[0].includes("@portfolio")) {
                                messages.push(attachmentData.data);
                                messageChain.set(no, messages);
                                if (msg.hasMedia) {
                                    messageToSend = "Thank you for sending your picture, please type a very brief description about the picture, here you could include what is in the picture, and/or the prices and/or the quality of work done, and how long it took you to have it done";
                                    visitor.pageview(`/portfolio/imagesent`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else {
                                    messageToSend = "It appears you did not send a picture or your picture was not download, please send again, the best of what you have, because this helps you get clients, if this is not what you want to do you can type # to restart";
                                    visitor.pageview(`/portfolio/imageNOTsent`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {

                                }).catch(console.error);
                            } else if (query === "1" && messages[0] === "1073unashe") { // Search 
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = `Please send the service you are looking for e.g  transport OR accommodation OR website OR phone repairs \n\nTerms and Conditions Apply to see them send term or click this link https://wa.me/${hiveBot}?text=@terms`;

                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    visitor.pageview(`/search/initialize`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch((console.error));
                            } else if (query === "2" && messages[0] === "1073unashe") {  //  Register today

                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend += `Please answer the next few questions, you will only be asked once, they help to market your services, so be honest and take them seriously.Do you want to register as a business or a freelancer?  \n*1* Business \n*2* Freelancer \n\nSelect the option you want by sending the corresponding number e.g 1 if you are registering as a business`;
                                // }
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    visitor.pageview(`/register/askforname`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch((console.error));




                            } else if (query === "3" && messages[0] === "1073unashe") { // How does this work option?
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = "Please select the option you would like \n\n \n*1* What is Hive? \n*2* Frequently Asked Questions \n*3* Terms and Conditions  \n\nTo choose any option send a number eg. 2 to get see Frequently asked questions";

                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    visitor.pageview(`/howdoesitwork/selectquestion`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch((console.error));
                            } else if (messages[0] === "addva") { // List of services
                                let servicesArray = query.split(";");
                                if (servicesArray.length < 1 || servicesArray === null) {
                                    messageToSend = "It appears you did not list your services the right way, please follow these instructions , we need just two more answers for your Virtual Assistant, please list all your services and the price for each separated by a semicolon in this format descr=amount and send them, all the you services listed above e.g website deveopmen=100USD; Mobile Application development=300USD \nOR \nMoving goods local(in town)=10USD;Moving goods above 2T=45USD \nOR \nPedicure=7USD,Manicure=10USD";
                                    visitor.pageview(`/addva/serviceslistedWRONG`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    messageToSend = `These are your services and prices, your Chatbot(Virtual Assistant) will use this to send quotations to people \n\n`;
                                    for (let index = 0; index < servicesArray.length; index++) {
                                        const element = servicesArray[index];
                                        messageToSend += `${index + 1} ${element.substring(0, element.indexOf("="))}  ${element.substring(element.indexOf("=") + 1, element.length)}\n\n`;
                                    }
                                    messageToSend += `Please confirm these are your services and the prices are correct \n*1* Yes, it is correct \n*2* Not correct, can I retype them  \n\nSend the number that shows the option you want e.g 1 to confirm these are correct `;
                                    visitor.pageview(`/addva/listedservicestoconfirm`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));
                            } else if (messages[0] === "@update") {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend += "Please type your services, separate each service by a semicolon,  e.g cooking; dancing; web development;decor; grooming and etiquitte, \n\nIf this is not what you want type # to restart ";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    visitor.pageview(`/update/listservices`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch(console.error);
                            } else if (messages[0] === "believeeducation@add") { // Believe education send key words
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = "Please send all the key words in this information separate each keyword, please try avoid spelling errors by semicolon,";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    visitor.pageview(`/believeeducation/addkeywords`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch(console.error);
                            } else if (messages[0] === "@service") { // Add service price
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = "Please send the price of this service e.g 50USD";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    visitor.pageview(`/addservice/sendprice`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch(console.error);
                            } else if (messages[0] === "@faq") { // Add faq answer
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = "Please send your answer to this question e.g It takes us 5 hours to get the work done";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    visitor.pageview(`/addfaq/sendanswer`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch(console.error);
                            } else if (messages[0] === "@addstock") { // Add stock number
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = `Please send the number of ${query} you have \n\nN.B this has to be a number`;
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    visitor.pageview(`/addstock/numberofitems`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch(console.error);
                            } else if (messages[0] === "@stock") { //See stock, either as pdf or as a message
                                let v = clientMap.get(no);
                                let inv = pdfMap.get(no);
                                let filePath = `./stock ${inv}.pdf`;
                                if (query === "1") {

                                    let mediaMessage = `${v.name} stock`;
                                    const media = MessageMedia.fromFilePath(filePath);

                                    client.sendMessage(no, media, { caption: mediaMessage }).catch(console.error);
                                    messageChain.delete(no);
                                    visitor.pageview(`/stock/sendstockpdf`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });

                                } else if (query === "2") {
                                    messageToSend = `This is the available stock\n\n`;
                                    for (let i = 0; i < v.length; i++) {
                                        const element = v[i];
                                        messageToSend += `Item Name:               ${element.visibleName} 
                                                        \nQuantity available:  ${element.numberOfItems}  
                                                        \nPrice per unit:          ${element.itemPrice}  
                                                        \nTotal items in USD: ${element.itemPrice * element.numberOfItems} `;
                                        messageToSend += `\n==========================\n`;

                                    }
                                    messageToSend += `\n__________END__________`;
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        visitor.pageview(`/stock/seeasmessage`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }).catch(console.error);
                                    //file removed
                                    fs.unlink(filePath, (err) => {
                                        if (err) {
                                            console.error(err)
                                            return
                                        }
                                    });
                                    messageChain.delete(no);
                                } else {
                                    messageToSend = `Please select the options 1 or 2, this is outside of the expected responses`;
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        visitor.pageview(`/stock/notexpected`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }).catch(console.error);
                                }
                            } else if (messages[0] === "@addstockmember") {
                                if (isValidPhoneNumber(query)) {
                                    let stock = clientMap.get(no);
                                    let newMember = `263${query.substring(1, query.length)}@c.us`;
                                    stockService.addMember(newMember, stock);
                                    messageToSend = `Member added! `;
                                    messageChain.delete(no);
                                    client.sendMessage(msg.from, messageToSend).then((res) => {

                                    }).catch(console.error);

                                } else {
                                    messageToSend = `Please enter a valid phonenumber, for this to work`;
                                    client.sendMessage(msg.from, messageToSend).then((res) => {

                                    }).catch(console.error);
                                }
                            } else {
                                messageToSend = "Please choose on of the options above";

                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    visitor.pageview(`/firstmaessage/wrongoption`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch((console.error));
                            }
                        }


                        break;
                    case 2:
                        if (messages.length > 3) {
                            messageToSend = "Our apology there was a network error, kindly try again";
                            messageChain.delete(no);
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                visitor.pageview(`/outsideofexpectedmessagelength`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            }).catch(console.error);

                        } else {
                            if (messages[0] === "@subscribe") { // @subscribe initiate payment

                                if (isValidPhoneNumber(query)) {
                                    //Initiating paynow

                                    const paynow = new Paynow("4114", "857211e6-052f-4a8a-bb42-5e0d0d9e38e7");
                                    let milliSecondsSinceEpoch = new Date().valueOf().toString();
                                    let payment = paynow.createPayment(milliSecondsSinceEpoch, "anelesiwawa@gmail.com");

                                    let package = 7.99;

                                    let amount = zwlPrice * package;
                                    payment.add("Subscription", amount);
                                    paynow.sendMobile(

                                        // The payment to send to Paynow
                                        payment,

                                        // The phone number making payment 
                                        query.toString(),

                                        // The mobile money method to use. 
                                        'ecocash'

                                    ).then((v) => {

                                        if (v.success) {
                                            messages.push(query);
                                            messageChain.set(no, messages);
                                            pollUrl = v.pollUrl;
                                            messageToSend += "After you set your PIN, type paid so we can confirm your payment or click https://wa.me/263713020524?text=paid   \n\nYou can Restart(type *#* to restart) ";
                                            visitor.pageview(`/sentpayment/waitingforpin`, function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        } else {
                                            messageToSend += "It appears there was an error, please type your number again, to retry   \n\nYou can Restart(type *#* to restart) ";
                                            visitor.pageview(`/sentpayment/unsuccessful`, function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        }
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch(console.error);
                                    }).catch((e) => {
                                        console.log(e);
                                        messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                        messageChain.delete(no);
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch(console.error);


                                    });

                                } else {
                                    messageToSend = "It appears you did not enter a valid phone number, please check the number and send again if this is not what you want, type # to restart";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                        visitor.pageview(`/subscribe/wrongnumbersent`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }).catch((console.error));
                                }
                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length) === "rate" && messages[0].includes("@rate")) {

                                let businessName = messages[0].substring(0, messages[0].indexOf('@'));
                                let newReview = new reviewsModel({
                                    review: query,
                                    name: businessName,
                                    urlName: businessName.toLowerCase().replace(/\s/g, ''),
                                    stars: parseInt(messages[1]),
                                    reviewer_no: no,
                                });

                                mongoWorker.addReview(newReview).then((r) => {


                                    messageToSend = "Thank you for leaving a review of the service you got, this will help someone else when they are interested in working with this person";

                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                        visitor.pageview("/rate/reviewadded", function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }).catch(console.error);

                                }).catch(console.error);
                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length) === "portfolio" && messages[0].includes("@portfolio")) {
                                //TODO Add file to firebase
                                let businessName = clientMap.get(no).name;
                                let urlName = businessName.toLowerCase().replace(/\s/g, '');
                                let milliSecondsSinceEpoch = new Date().valueOf().toString();


                                return firebase.addImage(businessName, messages[1], milliSecondsSinceEpoch.toString()).then((imageUrl) => {

                                    if (imageUrl === null) {
                                        messageToSend = `There was an error adding your portfolio picture please try again, if the problem persists try again later, https://wa.me/${hiveBot}?text=@pic`;
                                        messageChain.delete(no);
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            visitor.pageview("/portfolio/addingpictureERROR", function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        }).catch(console.error);
                                    } else {
                                        let portfolio = new portfolioModel({
                                            name: businessName,
                                            no: no,
                                            imageUrl: imageUrl,
                                            urlName: urlName,
                                            description: query,
                                            date: new Date(),
                                        })
                                        return mongoWorker.addPortfolio(portfolio).then((r) => {
                                            //TODO check is was added successfully
                                            messageToSend = `Your image was added to your portfolio successfully, you can add more, we encourage you to do so, by clicking https://wa.me/${hiveBot}?text=@portfolio`;
                                            messageChain.delete(no);
                                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                                visitor.pageview("/portfolio/added", function (err) {
                                                    if (err) {
                                                        console.error(err);
                                                    }
                                                    // Handle the error if necessary.
                                                    // In case no error is provided you can be sure
                                                    // the request was successfully sent off to Google.
                                                });
                                            }).catch(console.error);
                                        }).catch(console.error);
                                    }


                                }).catch(console.error);


                            } else if (messages[0].substring(messages[0].indexOf("@"), messages[0].length).toLowerCase() === "@va" && messages[0].includes("@va")) {
                                let v = clientMap.get(no); // get the business's profile saved in the map
                                if (messages[1] === "2") { // Confirm this is option for services
                                    if (query === "1") { // Confirm items for Quotation
                                        messages.push(query);
                                        messageChain.set(no, messages);
                                        let servicesPrices = v.prices.split(";");
                                        messageToSend = `Here are ${v.name}'s Services and costs again for you to choose \n\n`;
                                        for (let index = 0; index < servicesPrices.length; index++) {
                                            const element = servicesPrices[index];
                                            messageToSend += `${index + 1} ${element.substring(0, element.indexOf("="))}  ${element.substring(element.indexOf("=") + 1, element.length)}\n\n`;
                                        }
                                        messageToSend += `____________END___________\n`;
                                        messageToSend += `Type the number of each of the services you want separated by a semicolon(for any service you need more than once you can just type it as many times as you need it)  and send e.g 1;2;2;3  for services 1 and 2(this service is required twice) and 3 \nOR \n1;1;1;2;3 for services 1(this service is required thrice) and 4 and 6 `;
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            visitor.pageview("/va/listedservicesandprices", function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        }).catch(console.error);
                                    } else if (query === "2") { // Portfolio
                                        return mongoWorker.getPortfolio(v.name).then((r) => {
                                            r.forEach(element => {
                                                let options = {
                                                    unsafeMime: true,
                                                }
                                                return MessageMedia.fromUrl(element.imageUrl, options).then((media) => {
                                                    client.sendMessage(msg.from, media, { caption: element.description }).then((v) => {
                                                        visitor.pageview("/va/portfoliowithmedia", function (err) {
                                                            if (err) {
                                                                console.error(err);
                                                            }
                                                            // Handle the error if necessary.
                                                            // In case no error is provided you can be sure
                                                            // the request was successfully sent off to Google.
                                                        });
                                                    }).catch(console.error);
                                                }).catch(console.error);

                                            });

                                        }).catch(console.error);

                                    } else if (query === "3") { // See reviews

                                        mongoWorker.getWorkerReviews(v.name).then((r) => {

                                            if (r.length > 0) {
                                                messageToSend += `These are last 7 reviews ${v.name} has had\n\n`;
                                                r.forEach((e) => {
                                                    messageToSend += `_Rating_:${e.stars}\n${e.review} \n\n`;
                                                });
                                                messageToSend += `________________END___________________\n`;
                                            } else {
                                                messageToSend += `${v.name} does not have any reviews yet`;
                                            }
                                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                                visitor.pageview("/see/reviews", function (err) {
                                                    if (err) {
                                                        console.error(err);
                                                    }
                                                    // Handle the error if necessary.
                                                    // In case no error is provided you can be sure
                                                    // the request was successfully sent off to Google.
                                                });
                                            }).catch(console.error);


                                        }).catch((e) => {
                                            console.error(e);
                                            messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                            messageChain.delete(no);
                                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                                visitor.pageview("/error", function (err) {
                                                    if (err) {
                                                        console.error(err);
                                                    }
                                                    // Handle the error if necessary.
                                                    // In case no error is provided you can be sure
                                                    // the request was successfully sent off to Google.
                                                });
                                            }).catch(console.error);

                                        });
                                    } else { // outside of the options

                                        messageToSend = `It appears you did not select one of the available options, please select option 1 or 2 or 3`;
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            visitor.pageview("/va/notexpected", function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        }).catch(console.error);
                                    }
                                } else if (messages[1] === "3") { // FAQs answers
                                    let answers = v.faqs.split(";");
                                    messageToSend = `Answer \n${answers[parseInt(query) - 1].substring(answers[parseInt(query) - 1].indexOf("=") + 1, answers[parseInt(query) - 1].length)}  \n\nYou can select another number to get an answer to another question, or type # to restart`;
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        visitor.pageview("/va/faq/answers", function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }).catch(console.error);
                                } else { // Selected option outside of those provided

                                    messageToSend = `It appears you did not select one of the available options, please select option 1 or 2 or 3`;
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        visitor.pageview("/va/notexpected", function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }).catch(console.error);
                                }

                            } else if (messages[1] === "1" && messages[0] === "1073unashe") { // Search

                                var seenProfiles = [];
                                mongoWorker.getWorkers(query, 0).then((r) => {

                                    if (r.results.length > 0) {
                                        messages.push(query);
                                        messageChain.set(no, messages);
                                        if (r.primary) {
                                            messageToSend += "Available service providers right now\n\n";
                                            visitor.pageview(`/search/results/${query}`, function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        } else {
                                            messageToSend += "Ooops we currently do not have the service, stay tuned, but in the meantime you can browse through or retry searching with another term, send # to restart\n\n";
                                            visitor.pageview(`/search/wrongresults/${query}`, function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        }

                                        r.results.forEach((el) => {
                                            messageToSend += `_Name_: *${el.name}* \n_Services_: ${el.skills} \n_See Profile_: https://wa.me/263713020524?text=${el.id}@profile  \n\n`;
                                            seenProfiles.push(el);
                                        });
                                        seenProfilesMap.set(no, seenProfiles);
                                        messageToSend += "_________________END_________________\n";
                                        messageToSend += `Please select one of the option below \n1)To see the next service providers \n\nType # to restart`;

                                    } else {
                                        messageToSend += `It appears there are no service providers that match your search at the moment, please try again tomorrow, or try searching using another term we have over 100 service providers already registered, \n\nYou can retry your search with a different term  here`;
                                        visitor.pageview(`/search/NORESULTS`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }

                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);

                                }).catch(console.error);

                            } else if (messages[1] === "2" && messages[0] === "1073unashe") { // Check name and send categories

                                if (query === "1") {
                                    checkPayment(no).then((v) => {
                                        if (v.expired) {
                                            messageToSend = "It appears you are yet to subscribe, please type @subscribe or click this link https://wa.me/263713020524?text=@subscribe";
                                            visitor.pageview(`/register/accountexpired`, function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        } else {
                                            var clientArr = [v.package];
                                            clientMap.set(no, clientArr);
                                            messages.push(query);
                                            messageChain.set(no, messages);
                                            messageToSend = `Please tell us your the name of your business (this has to be unique, if it was already taken you will be asked again), \n\nIf this is not what you want type # to restart`;
                                            visitor.pageview(`/register/nameofbusiness`, function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        }
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch((console.error));
                                    });
                                } else if (query === "2") {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    messageToSend = `Please tell us your full name (this has to be unique, if it was already taken you will be asked again), \n\nIf this is not what you want type # to restart`;
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch((console.error));
                                }

                            } else if (messages[1] === "3" && messages[0] === "1073unashe") { // How does it work?
                                if (query === "1") { // What is hive?
                                    messageToSend = "Hive is a platform  \n\n*For service providers* \nIt helps them market their services and gives them software tools to improve their services like a chatbot to assist in managing customer services, and managing your business efficiently, and a website to help market your business online \n\n*For people searching for a service* \nIt helps people who are searching for services get them conviniently, excellently and reliably, to use Hive you can use our Whatsapp system on this number.\n\nTo learn more about us check out our website on www.hive.co.zw";
                                    visitor.pageview(`/how/whatishive`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else if (query === "2") { // FAQs
                                    visitor.pageview(`/how/faqs`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    messageToSend = "Please send the number of the option you want \n\n*1* I am looking for a service what do I do? \n*2* I am a freelancer what should I do?  \n*3* I have a business what should I do? \n*4* What is a Virtual Assistant?  \n*5* What is a Landing Page? \n*6* How do I access the landing page?  \n\nFor any other questions you can contact our support number by clicking this link https://wa.me/263719940513?text=Hi+Hive+I+have+a+question";
                                } else if (query === "3") { // Terms and conditions
                                    messageToSend = "Sending Terms and Conditions Pdf document";
                                    var mediaMessage = "Hive Terms and Conditions";
                                    const media = MessageMedia.fromFilePath('./t&cs.pdf');
                                    messageChain.delete(no);
                                    client.sendMessage(no, media, { caption: mediaMessage }).then((v) => {
                                        visitor.pageview(`/how/terms`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }).catch(console.error);
                                } else { // Option outside available ones
                                    messageToSend = "You were looking at FAQs, but sent something outside the options, so the chat has restarted, you can type hi now";
                                    messageChain.delete(no);
                                    visitor.pageview(`/how/notexpected`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));

                            } else if (messages[0] === "addva") { // Ask for FAQs
                                if (query === "1") {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    messageToSend = "One last question, your clients, might have questions, please help them get answers quickly, by sending frequently asked questions in the format question=answer separate each by a semicolon \n\nExamples \nDo you do house calls?=yes;how much is pedicure if I have my own nails?=To ensure quality we use only our nails which we know the source and works well together the rest of our tools \nOR \nHow secure is your website?=It is very secure and even protected from bots;How long does it take to make a mobile application on average?=It takes 3 weeks for a basic application more complex apps might take longer but never more than 3 months \nOR\nHow big is your truck to move my goods?=We can take every load size 2T, 5T, 10T to carry every load;I have few items that I want to carry local, does that change the price?=No our local prices are fixed";
                                    visitor.pageview(`/addva/addfaqs`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else if (query === "2") {
                                    messageToSend = `Okay let us do this again,we need just two more answers for your Virtual Assistant, please list all your services and the price for each separated by a semicolon in this format descr=amount and send them, all the you services listed above e.g website deveopmen=100USD; Mobile Application development=300USD \nOR \nMoving goods local(in town)=10USD;Moving goods above 2T=45USD \nOR \nPedicure=7USD,Manicure=10USD   \n\nClick this link to restart https://wa.me/${hiveBot}?text=addva`;
                                    messageChain.delete(no);
                                    visitor.pageview(`/addva/restart`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else {
                                    visitor.pageview(`/addva/notexpected`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                    messageToSend = "This response is out of the expected one, Please send one of the options indicated above 1 or 2 or 3 or 4";
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));
                            } else if (messages[0] === "@update") {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend += `Please select the category of your services by typing the number of the category e.g 3,or clicking the link below it \n\n1)Administration, business and management\nhttps://wa.me/263713020524?text=1 \n\n2)Animals, land and environment\nhttps://wa.me/263713020524?text=2 \n\n3)Architecture\nhttps://wa.me/263713020524?text=3 \n\n4)Computing and ICT\nhttps://wa.me/263713020524?text=4 \n\n5)Construction and building\nhttps://wa.me/263713020524?text=5 \n\n6)Design, arts and crafts\nhttps://wa.me/263713020524?text=6 \n\n7)Education and training\nhttps://wa.me/263713020524?text=7 \n\n8)Energy production services\nhttps://wa.me/263713020524?text=8 \n\n9)Engineering\nhttps://wa.me/263713020524?text=9  \n\n10)Facilities and property services\nhttps://wa.me/263713020524?text=10 \n\n11)Farming, Fishing, and Forestry\nttps://wa.me/263713020524?text=11 \n\n12)Financial services\nhttps://wa.me/263713020524?text=12 \n\n13)Garage services\nhttps://wa.me/263713020524?text=13  \n\n14)Hairdressing and beauty https://wa.me/263713020524?text=14 \n\n15)Healthcare\nhttps://wa.me/263713020524?text=15  \n\n16)Heritage, culture and libraries\nhttps://wa.me/263713020524?text=16  \n\n17)Hospitality, catering and tourism \nhttps://wa.me/263713020524?text=17 \n\n18)Languages \nhttps://wa.me/263713020524?text=18 \n\n19)Legal and court services\nhttps://wa.me/263713020524?text=19 \n\n20)Manufacturing and production\nhttps://wa.me/263713020524?text=20 \n\n21)Mining and extraction services\nhttps://wa.me/263713020524?text=21  \n\n22)Performing arts and media \nhttps://wa.me/263713020524?text=22   \n\n23)Print and publishing, marketing and advertising \nhttps://wa.me/263713020524?text=23  \n\n24)Retail and customer services\nhttps://wa.me/263713020524?text=24  \n\n25)Science, mathematics and statistics \nhttps://wa.me/263713020524?text=25 \n\n26)Security, uniformed and protective services \nhttps://wa.me/263713020524?text=26 \n\n27)Social sciences and religion\nhttps://wa.me/263713020524?text=27 \n\n28)Social work and caring services\nhttps://wa.me/263713020524?text=28 \n\n29)Sport and leisure \nhttps://wa.me/263713020524?text=29 \n\n30)Transport, distribution and logistics\nhttps://wa.me/263713020524?text=30  \n\n#) Restart(type # to restart)`;
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    visitor.pageview(`/update/selectcategories`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch(console.error);
                            } else if (messages[0] === "believeeducation@add") { // Believe Education option to add image or not
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend += "Do you want to add an image? Please select one of the options below \n*1* Yes \n*2* No";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    visitor.pageview(`/believeeducation/choosetoaddimage`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch(console.error);
                            } else if (messages[0] === "@service") { // Save service 

                                if (typeof parseInt(query) === "number") {
                                    messageChain.delete(no);
                                    let service = messages[1] + "=" + query;
                                    mongoWorker.addService(no, service).then((r) => {

                                        if (r.expired) {
                                            messageToSend = "Service added, you can add more services with prices by sending the keyword @service";
                                            visitor.pageview(`/addservice`, function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        } else {
                                            messageToSend = "It appears there was an error adding the service please try again by sending the keyword @service";
                                            visitor.pageview(`/addservice/error`, function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        }
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch(console.error);

                                    }).catch(console.error);
                                } else {
                                    visitor.pageview(`/addservice/wrongnumber`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                    messageToSend = "It appears what you sent is not a number, please send the price for the service";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);
                                }





                            } else if (messages[0] === "@faq") { // Save faq 
                                messageChain.delete(no);
                                let service = messages[1] + "=" + query;
                                mongoWorker.addService(no, service).then((r) => {

                                    if (r.expired) {
                                        visitor.pageview(`/addfaq`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                        messageToSend = "Frequently asked question added, you can add more services with prices by sending the keyword @service";

                                    } else {
                                        visitor.pageview(`/addfaq/error`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                        messageToSend = "It appears there was an error adding your question and answer please try again by sending the keyword @service";
                                    }
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);

                                }).catch(console.error);
                            } else if (messages[0] === "@addstock") { // Add item price
                                if (typeof parseInt(query) === "number") {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    messageToSend = `What is the price of ${messages[1]} per unit, that is, what is the price of one item in USD \n\nN.B this is important for accounting reports and should be a number`;
                                    visitor.pageview(`/addstock/additemprice`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else {
                                    visitor.pageview(`/addstock/numberofitemsERROR`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                    messageToSend = `It appears you did not send the number of items as a number, please send as a number, if this is not what you want, send # to restart`;
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            } else {
                                visitor.pageview(`/messageslength2/notexpected`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                                messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                                messageChain.delete(no);
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            }
                        }


                        break;
                    case 3:
                        if (messages[1] === "1" && messages[0] === "1073unashe") { // Search for services 2 round of results
                            if (query === "1") {
                                var seenProfiles = seenProfilesMap.get(no);
                                mongoWorker.getWorkers(messages[2], seenProfiles.length).then((r) => {

                                    if (r.results.length > 0) {


                                        if (r.results.length > 0) {
                                            if (r.primary) {
                                                messageToSend += "Available service providers right now\n\n";
                                            } else {
                                                messageToSend += "Ooops we currently do not have the service, stay tuned, but in the meantime you can browse through or retry searching with another term, send # to restart\n\n";
                                            }

                                            r.results.forEach((el) => {
                                                messageToSend += `_Name_: *${el.name}* \n_Services_: ${el.skills} \n_See Profile_: https://wa.me/263713020524?text=${el.id}@profile  \n\n`;
                                                seenProfiles.push(el);
                                            });
                                            seenProfilesMap.set(no, seenProfiles);
                                            messageToSend += "_________________END_________________\n";
                                            messageToSend += `Please select one of the option below \n1)To see the next service providers \n\nType # to restart`;
                                            visitor.pageview(`/search/results/${seenProfiles.length}`, function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        } else {
                                            messageToSend += `It appears there are no service providers that match your search at the moment, please try again tomorrow, or try searching using another term we have over 100 service providers already registered, \n\nYou can retry your search with a different term  here`;
                                            visitor.pageview(`/search/results/noserviceproviders/${seenProfiles.length}`, function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        }


                                    } else {
                                        messageToSend += `It appears there are no service providers that match your search at the moment, please try again tomorrow, or try searching using another term we have over 100 service providers already registered, \n\nYou can retry your search here`;
                                        visitor.pageview(`/search/outofresults/${seenProfiles.length}`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }

                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);

                                }).catch(console.error);
                            } else {
                                messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                                messageChain.delete(no);
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    visitor.pageview(`/search/notexpected`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch(console.error);
                            }

                        } else if (messages[1] === "2" && messages[0] === "1073unashe") { // Register 

                            mongoWorker.checkName(query.toLowerCase()).then((v) => {

                                if (v === null) {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    let typeOfRegistration = "services";
                                    if (messages[2] === "2") {
                                        typeOfRegistration = "skills";
                                    }
                                    messageToSend += `Please select the category of your ${typeOfRegistration} by typing the number of the category e.g 3,or clicking the link below it \n\n1)Administration, business and management\nhttps://wa.me/263713020524?text=1 \n\n2)Animals, land and environment\nhttps://wa.me/263713020524?text=2 \n\n3)Architecture\nhttps://wa.me/263713020524?text=3 \n\n4)Computing and ICT\nhttps://wa.me/263713020524?text=4 \n\n5)Construction and building\nhttps://wa.me/263713020524?text=5 \n\n6)Design, arts and crafts\nhttps://wa.me/263713020524?text=6 \n\n7)Education and training\nhttps://wa.me/263713020524?text=7 \n\n8)Energy production services\nhttps://wa.me/263713020524?text=8 \n\n9)Engineering\nhttps://wa.me/263713020524?text=9  \n\n10)Facilities and property services\nhttps://wa.me/263713020524?text=10 \n\n11)Farming, Fishing, and Forestry\nttps://wa.me/263713020524?text=11 \n\n12)Financial services\nhttps://wa.me/263713020524?text=12 \n\n13)Garage services\nhttps://wa.me/263713020524?text=13  \n\n14)Hairdressing and beauty https://wa.me/263713020524?text=14 \n\n15)Healthcare\nhttps://wa.me/263713020524?text=15  \n\n16)Heritage, culture and libraries\nhttps://wa.me/263713020524?text=16  \n\n17)Hospitality, catering and tourism \nhttps://wa.me/263713020524?text=17 \n\n18)Languages \nhttps://wa.me/263713020524?text=18 \n\n19)Legal and court services\nhttps://wa.me/263713020524?text=19 \n\n20)Manufacturing and production\nhttps://wa.me/263713020524?text=20 \n\n21)Mining and extraction services\nhttps://wa.me/263713020524?text=21  \n\n22)Performing arts and media \nhttps://wa.me/263713020524?text=22   \n\n23)Print and publishing, marketing and advertising \nhttps://wa.me/263713020524?text=23  \n\n24)Retail and customer services\nhttps://wa.me/263713020524?text=24  \n\n25)Science, mathematics and statistics \nhttps://wa.me/263713020524?text=25 \n\n26)Security, uniformed and protective services \nhttps://wa.me/263713020524?text=26 \n\n27)Social sciences and religion\nhttps://wa.me/263713020524?text=27 \n\n28)Social work and caring services\nhttps://wa.me/263713020524?text=28 \n\n29)Sport and leisure \nhttps://wa.me/263713020524?text=29 \n\n30)Transport, distribution and logistics\nhttps://wa.me/263713020524?text=30  \n\n#) Restart(type # to restart)`;
                                    visitor.pageview(`/registration/${typeOfRegistration}`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else {
                                    messageToSend = "This name is already taken please try another name or structure it differently"
                                    visitor.pageview(`/registration/nametaken`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));

                            }).catch(console.error);



                        } else if (messages[1] === "3" && messages[0] === "1073unashe") { // How does this work
                            if (messages[2] === "2") { // FAQs
                                if (query === "1") {
                                    messageToSend = "You can find a service on this whatsapp system, the option to find service providers in option 1 on the welcome page, to search from this point type # to restart, then type hi, and after the welcome message, then send 1 and after the question type the service or service provider you are looking for, \n\nIT IS FREE TO USE";
                                    visitor.pageview(`/faqs/howtosearch`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else if (query === "2") {
                                    messageToSend = "Hive will help you get clients, and begin making money registration is FREE, you only pay after you get leads, and you will see the leads as they come, to create your FREE profile, type # and send, then click the link, after the welcome message send option 2, then send option 2 and answer the few questions that follow";
                                    visitor.pageview(`/faqs/freelancer`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else if (query === "3") {
                                    messageToSend = "Hive Enteprise Solution will help you lower the costs of your business with access to tools like stock management, and help you reach more people with tools like a landing page, while also helping you attending to clients with tools like a chatbot , all these normally amount to over ~2000USD~ but you can get it for only 7.99USD p.m no contract, meaning you can cancel at anytime ";
                                    visitor.pageview(`/faqs/iamabusiness`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else if (query === "4") {
                                    messageToSend = "A virtual assistant is a Whatsapp with automated(Computer generated) responses sometimes refered to as Whatsapp Bot, Hive is an example of such, when you create a profile you get to create one for your services, so clients can see your prices, see Frequently asked questions, and even get a quotation in pdf format, with a virtual assistant you can concentrate on your work, while it works for you";
                                    visitor.pageview(`/faqs/whatisavirtualassistant`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else if (query === "5") {
                                    messageToSend = "Hive landing page is a online site for your services only available for businesses, it would be found on [yourname].hive.co.zw , and is really a website without the extra costs of a domain and hosting, and new ways of showing your website will be added weekly, it helps you increase your market reach, and attract more clients to your business";
                                    visitor.pageview(`/faqs/whatisalandingpage`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else if (query === "6") {
                                    messageToSend = "You can access your landing page via the link [yourname].hive.co.zw only available for businesses, you can even use it in your marketing campaigns as it will help you leave a greater impression on the client check this example unashe.hive.co.zw";
                                    visitor.pageview(`/faqs/howdoiaccessmylandingpage`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else {
                                    messageToSend = "This response is out of the expected one, Please send one of the options indicated above 1 or 2 or 3 or 4";
                                    visitor.pageview(`/faqs/answers/notexpected`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }

                            } else {
                                messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                                messageChain.delete(no);
                            }
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch((console.error));

                        } else if (messages[0] === "@subscribe") { // Subscribe Confirm payment
                            if (query.toLowerCase() === "paid") {
                                let status = await axios.get(pollUrl);
                                console.log(pollUrl);
                                if (status.data.includes("status=Paid") || status.data.includes("status=Awaiting Delivery") || status.data.includes("status=Delivered")) {

                                    let package = 7.99;

                                    let amount = zwlPrice * package;

                                    let payment = new Payment({
                                        package: package,
                                        amount: amount,
                                        numberUsedInPayment: messages[2],
                                        no: no,
                                        date: new Date(),
                                        dayOfYear: dayOfYear(new Date()),
                                        valid: true
                                    });

                                    paymentService.addPayment(payment).then((v) => {
                                        console.log(v);
                                        if (v.valid) {
                                            messageToSend = "Your payment was successful valid for the next 30 days added to your account \n\nRestart(type *#* to restart) ";
                                            messageChain.delete(no);
                                            visitor.pageview(`/subscribe/paymentsuccessful`, function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        } else {
                                            messageToSend += "It appears it not successful to add your payment type paid and send again, if this persists,kindly contact the team if you paid, so we can credit your account,BE READY with your payment confirmation, \nClick this link https://wa.me/263719066282?text=Hi+Hive+I+paid+but+the+payment+did+not+get+reflected+on+your+side \nYou can Restart(type *#* to restart) ";
                                            visitor.pageview(`/subscribe/payment/notaddedsuccessfully`, function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        }
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch(console.error);

                                    }).catch((e) => {
                                        console.error(e);
                                        messageToSend = "Oooops looks like there was an error, please try again, by sending a new message ";
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                            visitor.pageview(`/subscribe/erroraddingpayment`, function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        }).catch(console.error);
                                    });
                                } else if (status.data.includes("status=Sent")) {
                                    messageToSend += "It is taking a bit more time to confirm your payment, please wait 2 minutes and type paid again \n\nRestart(type *#* to restart) ";
                                    client.sendMessage(no, messageToSend).then((res) => {
                                        // console.error("Res " + JSON.stringify(res));
                                        visitor.pageview(`/subscribe/paymentsstatussent`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }).catch(console.error);

                                } else {

                                    messageToSend += "It appears your payment was not successful type paid and send again, if this persists kindly contact the team if you paid, so we can credit your account,BE READY with your payment confirmation, \nClick this link https://wa.me/263719066282?text=Hi+Hive+I+paid+but+the+payment+did+not+get+reflected+on+your+side \nYou can Restart(type *#* to restart) ";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                        visitor.pageview(`/subscribe/paymentcancelled`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                        messageChain.delete(no);
                                    }).catch(console.error);
                                }
                            } else {
                                visitor.pageview(`/subscribe/confirmpayment/notexpected`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                                messageToSend = "It appears you sent something that is outside of the available options, did you want to confirm payment, send paid or click this link https://wa.me/263713020524?text=paid, if this is not what you want type # to restart";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));
                            }
                        } else if (messages[0].substring(messages[0].indexOf("@"), messages[0].length).toLowerCase() === "@va" && messages[0].includes("@va")) {
                            let v = clientMap.get(no); // get the business's profile saved in the map

                            if (messages[1] === "2") {  // Confirm this is option for services


                                if (messages[2] === "1") { // Confirm this is option for create quotation

                                    if (v.prices.includes("=")) {
                                        if (query.split(";").length > 0) { // Ensure query typed in properly
                                            messages.push(query);
                                            messageChain.set(no, messages);
                                            let chosenServices = query.split(";");
                                            let allServices = v.prices.split(";");
                                            messageToSend = `These are the services you chose \n\n`;
                                            for (let index = 0; index < chosenServices.length; index++) {
                                                const element = chosenServices[index] - 1;
                                                if (element < allServices.length) { // Only available services show
                                                    messageToSend += `${allServices[element].substring(0, allServices[element].indexOf("="))}  ${allServices[element].substring(allServices[element].indexOf("=") + 1, allServices[element].length)}\n\n`;
                                                }
                                            }
                                            messageToSend += `____________END___________\n`;
                                            messageToSend += `Please confirm these are the services you wanted and send \n*1* Yes, these are the services I want \n*2* No, let me resend the services I want`;
                                            visitor.pageview(`/va/services/quotation/listedservices`, function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        } else { // Quotation query not typed properly
                                            messageToSend += `It appears you did not type in the services you want properly, please try again, if this is not what you want, type # and send to restart`;
                                            visitor.pageview(`/va/services/quotation/servicesnotlistedproperly`, function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        }
                                    } else {
                                        messageToSend += `It appears the service provider did not add their services properly, type # and send to restart`;
                                        visitor.pageview(`/va/services/notlistedproperly`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                        client.sendMessage(v.no, `There was someone who wanted to search for a service, by was hindered because you did not add your services properly, please send addva to correct that`).catch(console.error);

                                    }

                                } else {
                                    messageToSend += `${allServices[element].substring(0, allServices[element].indexOf("="))}  ${allServices[element].substring(allServices[element].indexOf("=") + 1, allServices[element].length)}\n\n`;
                                    visitor.pageview(`/va/services/prices`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }

                            } else { // outside of expected responses
                                messageToSend = `It appears you did not select one of the available options, please select option 1 or 2 or 3`;

                            }
                            client.sendMessage(msg.from, messageToSend).then((res) => {

                            }).catch(console.error);
                        } else if (messages[0] === "addva") { // Listed FAQs
                            let faqsArray = query.split(";");
                            if (faqsArray.length < 1 || faqsArray === null) {
                                messageToSend = "It appears you did not list your frequently asked questions the right way, please follow these instructions , your clients might have questions, please help them get answers quickly, by sending frequently asked questions in the format question=answer separate each by a semicolon e.g Do you do house calls?=yes;how much is pedicure if I have my own nails?=To ensure quality we use only our nails which we know the source and works well together the rest of our tools \nOR \nHow secure is your website?=It is very secure and even protected from bots;How long does it take to make a mobile application on average?=It takes 3 weeks for a basic application more complex apps might take longer but never more than 3 months \nOR\nHow big is your truck to move my goods?=We can take every load size 2T, 5T, 10T to carry every load;I have few items that I want to carry local, does that change the price?=No our local prices are fixed";
                                visitor.pageview(`/addva/faqs/notlistedwell`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            } else {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = `These are your questions and answers\n\n`;
                                for (let index = 0; index < faqsArray.length; index++) {
                                    const element = faqsArray[index];
                                    messageToSend += `${index + 1} *${element.substring(0, element.indexOf("="))}*  \n${element.substring(element.indexOf("=") + 1, element.length)}\n\n`;
                                }
                                messageToSend += `Please confirm these are your questions and the answers are correct,  \n*1* Yes, it is correct \n*2* Not correct, can I retype them \nSend the number that shows the option you want e.g 1 to confirm these are correct `;
                                visitor.pageview(`/addva/confirmfaqs`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            }
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch((console.error));
                        } else if (messages[0] === "@update") {
                            messages.push(query);
                            messageChain.set(no, messages);
                            messageToSend = "Please type the areas your are able to offer services in, include suburb and city, e.g Avondale, Harare, Epworth Harare";
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                                visitor.pageview(`/updates/listservices`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            }).catch(console.error);
                        } else if (messages[0] === "believeeducation@add") { // Belive Education adding image or adding info

                            if (query === "1") {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend += "Please send the picture that you want added along with this information";

                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    visitor.pageview(`/beliveeducation/sendpicture`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch(console.error);
                            } else if (query === "2") { // Adding info
                                var answer = new answerModel({
                                    info: messages[1],
                                    keywords: messages[2].split(";"),
                                    date: new Date(),
                                    expired: false
                                });


                                beliveEducationService.addAnswer(answer).then((v) => {

                                    if (!v.expired) {
                                        messageToSend = `Your information has been added, you can add more by clicking this link https://wa.me/${hiveBot}?text=believeeducation@add`;
                                        visitor.pageview(`/believeeducation/infoadded`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    } else {
                                        messageToSend = `It appears you there was an error adding your information please try again, if this persists please contact us by clicking https://wa.me/${contactUs}?text=Hi+Hive+It+appears+there+was+an+error+creating+my+account`;
                                        visitor.pageview(`/believeeducation/erroraddinginfo`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }

                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        messageChain.delete(no);
                                    }).catch(console.error);


                                }).catch((e) => {
                                    console.error(e);
                                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                    messageChain.delete(no);
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                        visitor.pageview(`/believeeducation/erroraddinginfo`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }).catch(console.error);

                                });
                            }


                        } else if (messages[0] === "@addstock") { // Confirm stock

                            if (typeof parseInt(query) === "number") {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = `Please confirm this is what you added: 
                                                 \nItem:                ${messages[1]} 
                                                 \nQuantity:         ${messages[2]} 
                                                 \nPrice per unit:${query}  
                                                 \n\nPlease select one of the options below \n*1* Yes, add it \n*2* No this is wrong, let's restart \n\nN.B Please take time to really make sure, because once added it can not be edited`;
                                visitor.pageview(`/addstock/confirm`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            } else {
                                messageToSend = `It appears you did not send the number of items as a number, please send as a number, if this is not what you want, send # to restart`;
                                visitor.pageview(`/addstock/didnotsendnumberofitems`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            }
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);

                        } else { // outside of expected responses
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                                visitor.pageview(`/messageleangth3/notexpected`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            }).catch(console.error);
                        }


                        break;
                    case 4:
                        if (messages[1] === "2" && messages[0] === "1073unashe") { // Registering , brief
                            let typeOfRegistration = "services";
                            if (messages[2] === "2") {
                                typeOfRegistration = "skills";
                            }
                            messages.push(query);
                            messageChain.set(no, messages);
                            messageToSend = `Please type your ${typeOfRegistration}, separated by a semicolon,  e.g cooking; dancing; web development;decor; grooming and etiquitte \n\nIf this is not what you want type # to restart `;
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                                visitor.pageview(`/registration/${typeOfRegistration}/listed`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            }).catch(console.error);


                        } else if (messages[0].substring(messages[0].indexOf("@"), messages[0].length).toLowerCase() === "@va" && messages[0].includes("@va")) {

                            if (messages[1] === "2") { // confirm its services


                                if (messages[2] === "1") { // confirm its create a quotation


                                    if (query === "1") { // Yes these are the services I want
                                        let v = clientMap.get(no);
                                        // Generate PDF
                                        messages.push(query);
                                        messageChain.set(no, messages);
                                        let chosenServices = messages[3].split(";");
                                        let allServices = v.prices.split(";");
                                        var quotation = {};

                                        // quotation.addresses.billing.number = no.substring(0, no.indexOf("@c.us"));
                                        quotation.name = v.name;
                                        quotation.memo = `Quotation for ${v.name} generated via Hive`;
                                        quotation.qNumber = invoice;
                                        pdfMap.set(no, invoice); // invoice put on messages[5]

                                        quotation.dueDate = `${new Date().getMonth() + 1}/${new Date().getDate()}/${new Date().getFullYear()}`
                                        let servicesOnQ = [];
                                        let subtotal = 0;
                                        for (let index = 0; index < chosenServices.length; index++) {
                                            const element = chosenServices[index] - 1;
                                            if (element < allServices.length) {
                                                servicesOnQ.push({
                                                    itemCode: element + 1,
                                                    description: allServices[element].substring(0, allServices[element].indexOf("=")),
                                                    // quantity: 2,
                                                    price: allServices[element].substring(allServices[element].indexOf("=") + 1, allServices[element].length),
                                                    amount: allServices[element].substring(allServices[element].indexOf("=") + 1, allServices[element].length)
                                                });
                                                subtotal += parseInt(allServices[element].substring(allServices[element].indexOf("=") + 1, allServices[element].length));
                                            }

                                        }
                                        quotation.items = servicesOnQ;
                                        quotation.subtotal = subtotal;
                                        const qg = new QGenerator(quotation);
                                        qg.generate();
                                        messageToSend = `PDF generated please select one of the options  \n*1* Send it now \n*2* I change my mind delete it \nSend the number of the option you want e.g Send 1 to get the generated Quotation`;
                                        visitor.pageview(`/va/quotation/pdfready`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    } else if (query === "2") { // Quotation was wrong lets try again
                                        messageChain.delete(no);
                                        messageToSend = `The chat has restarted, you can click on this link to talk to this Chatbot https://wa.me/${hiveBot}?text=${messages[0]}`;
                                        // messageChain.set(no, messages.pop());
                                        // let servicesPrices = query.split(",");
                                        // messageToSend = `Okay let us do this again \n\n`;
                                        // for (let index = 0; index < servicesPrices.length; index++) {
                                        //     const element = servicesPrices[index];
                                        //     messageToSend += `${index + 1} ${element.substring(0, element.indexOf("="))}  ${element.substring(element.indexOf("=") + 1, element.length)}}\n\n`;
                                        // }
                                        // messageToSend += `____________END___________\n`;
                                        // messageToSend += `Type the number of each of the services you want separated by a comma(if you want more than one of the same service, you can list it as many times as you want it)  and send e.g 1,2,3  for services 1 and 2 and 3 \nOR \n2,4,6 for services 2 and 4 and 6 `;
                                        visitor.pageview(`/va/quotation/quotationwaswrong`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    } else {
                                        messageToSend = `It appears you did not select one of the available options, please select option 1 or 2 `;
                                        visitor.pageview(`/va/quotation/notexpected`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }

                                } else { // outside of the expected options
                                    messageToSend = `It appears you did not select one of the available options, please select option 1 or 2`;
                                    visitor.pageview(`/va/quotation/notexpected`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }

                            } else {
                                messageToSend = `It appears you did not select one of the available options, please select option 2, or restart, to restart type # and send`;
                                visitor.pageview(`/va/messagesleangth4/notexpected`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            }
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);
                        } else if (messages[0] === "addva") { // Chatbot created
                            if (query === "1") {
                                messages.push(query);
                                messageChain.set(no, messages);
                                let prices = messages[1];
                                let faqs = messages[3];
                                let name = clientMap.get(no).name;
                                mongoWorker.addVA(no, prices, faqs).then((v) => {
                                    messageToSend = `Chatbot(Virtual Assistant) created, \nFor anyone to use your Virtual Assistant or Chatbot they need to use this link \nhttps://wa.me/${hiveBot}?text=${name.toLowerCase()}@va your name with @va added to it \nIf you ever add more services you can add your service using this link \nhttps://wa.me/${hiveBot}?text=${name.toLowerCase()}@services \nTo add pictures of some of the work you have done use this link \nhttps://wa.me/263713020524?text${name.toLowerCase()}@portfolio`;
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                        visitor.pageview(`/addva/successfulcreated`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                        messageChain.delete(no);
                                    }).catch(console.error);


                                }).catch((e) => {
                                    console.error(e);
                                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                    messageChain.delete(no);
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                        visitor.pageview(`/addva/notaddedsuccessfully`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }).catch(console.error);

                                });
                            } else if (query === "2") {
                                messageChain.delete(no);
                                messageToSend = `Okay let us do this again, One last question, your clients, might have questions, please help them get answers quickly, by sending frequently asked questions in the format question=answer separate each by a semicolon\nExamples \n\nDo you do house calls?=yes;how much is pedicure if I have my own nails?=To ensure quality we use only our nails which we know the source and works well together the rest of our tools \nOR \nHow secure is your website?=It is very secure and even protected from bots;How long does it take to make a mobile application on average?=It takes 3 weeks for a basic application more complex apps might take longer but never more than 3 months \nOR\nHow big is your truck to move my goods?=We can take every load size 2T, 5T, 10T to carry every load;I have few items that I want to carry local, does that change the price?=No our local prices are fixed  \n\nClick on this link to restart https://wa.me/${hiveBot}?text=addva`;
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    visitor.pageview(`/addva/addfaqs`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch(console.error);
                            } else {
                                messageToSend = "Please choose one of the follow options, 1 or 2, what you sent is not within the scope of the current chat, if this is not what you want type #";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    visitor.pageview(`/addva/messageslength4/notexpected`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch(console.error);
                            }
                        } else if (messages[0] === "@update") { // update add account
                            messages.push(query);
                            messageChain.set(no, messages);
                            var category = "";

                            switch (messages[3]) {
                                case "1":
                                    category = "Administration, business and management";
                                    break;
                                case "2":
                                    category = "Animals, land and environment";
                                    break;
                                case "3":
                                    category = "Architecture";
                                    break;
                                case "4":
                                    category = "Computing and ICT";
                                    break;
                                case "5":
                                    category = "Construction and building";
                                    break;
                                case "6":
                                    category = "Design, arts and crafts";
                                    break;
                                case "7":
                                    category = "Education and training";
                                    break;
                                case "8":
                                    category = "Energy production services";
                                    break;
                                case "9":
                                    category = "Engineering";
                                    break;
                                case "10":
                                    category = "Facilities and property services";
                                    break;
                                case "11":
                                    category = "Farming, Fishing, and Forestry";
                                    break;
                                case "12":
                                    category = "Financial services";
                                    break;
                                case "13":
                                    category = "Garage services";
                                    break;
                                case "14":
                                    category = "Hairdressing and beauty";
                                    break;
                                case "15":
                                    category = "Healthcare";
                                    break;
                                case "16":
                                    category = "Heritage, culture and libraries";
                                    break;
                                case "17":
                                    category = "Hospitality, catering and tourism";
                                    break;
                                case "18":
                                    category = "Languages";
                                    break;
                                case "19":
                                    category = "Legal and court services";
                                    break;
                                case "20":
                                    category = "Manufacturing and production";
                                    break;
                                case "21":
                                    category = "Mining and extraction services";
                                    break;
                                case "22":
                                    category = "Performing arts and media";
                                    break;
                                case "23":
                                    category = "Print and publishing, marketing and advertising";
                                    break;
                                case "24":
                                    category = "Retail and customer services";
                                    break;
                                case "25":
                                    category = "Science, mathematics and statistics";
                                    break;
                                case "26":
                                    category = "Security, uniformed and protective services";
                                    break;
                                case "27":
                                    category = "Social sciences and religion";
                                    break;
                                case "28":
                                    category = "Social work and caring services";
                                    break;
                                case "29":
                                    category = "Sport and leisure";
                                    break;
                                case "30":
                                    category = "Transport, distribution and logistics";
                                    break;
                                default:
                                    category = "Administration, business and managemen";
                                    break;
                            }

                            var worker = new Worker({
                                brief: messages[1],
                                skills: messages[2],
                                category: category,
                                areas: messages[4],
                                date: new Date(),
                            });


                            mongoWorker.updateWorkerProfile(worker).then((v) => {

                                if (!v.expired) {
                                    messageToSend = `Thank you for your patience, You account profile has been updated`;
                                    messageChain.delete(no);
                                    visitor.pageview(`/update/accountadded`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                } else {
                                    messageToSend = `It appears you there was an error saving your profile, could it be, that there is already an account saved on this account? If not, kindly try again later, but if the error persists, please contact us by clicking https://wa.me/${contactUs}?text=Hi+Hive+It+appears+there+was+an+error+creating+my+account`;
                                    visitor.pageview(`/update/erroraddingaccount`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }

                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                }).catch(console.error);


                            }).catch((e) => {
                                console.error(e);
                                messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                messageChain.delete(no);
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    visitor.pageview(`/update/erroraddingaccount`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch(console.error);

                            });
                        } else if (messages[0] === "believeeducation@add") { // Belive Education adding image and adding info
                            let businessName = clientMap.get(no).name;
                            let urlName = businessName.toLowerCase().replace(/\s/g, '');
                            let milliSecondsSinceEpoch = new Date().valueOf().toString();

                            if (msg.hasMedia) {
                                return firebase.addImage(urlName, attachmentData.data, milliSecondsSinceEpoch.toString()).then((imageUrl) => {

                                    if (imageUrl === null) {
                                        messageToSend = `There was an error adding your image picture please try again, if the problem persists try again later, https://wa.me/${hiveBot}?text=@pic`;
                                        messageChain.delete(no);
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            visitor.pageview(`/believeeducation/erroraddingpicture`, function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });
                                        }).catch(console.error);
                                    } else {
                                        var answer = new answerModel({
                                            info: messages[1],
                                            keywords: messages[2].split(";"),
                                            date: new Date(),
                                            expired: false,
                                            imageUrl: imageUrl
                                        });


                                        return beliveEducationService.addAnswer(answer).then((v) => {

                                            if (!v.expired) {
                                                messageToSend = `Your information has been added, you can add more by clicking this link https://wa.me/${hiveBot}?text=believeeducation@add`;
                                                visitor.pageview(`/believeeducation/addedinfoandimage`, function (err) {
                                                    if (err) {
                                                        console.error(err);
                                                    }
                                                    // Handle the error if necessary.
                                                    // In case no error is provided you can be sure
                                                    // the request was successfully sent off to Google.
                                                });
                                            } else {
                                                messageToSend = `It appears you there was an error adding your information please try again, if this persists please contact us by clicking https://wa.me/${contactUs}?text=Hi+Hive+It+appears+there+was+an+error+creating+my+account`;
                                                visitor.pageview(`/believeeducation/erroraddinginfo`, function (err) {
                                                    if (err) {
                                                        console.error(err);
                                                    }
                                                    // Handle the error if necessary.
                                                    // In case no error is provided you can be sure
                                                    // the request was successfully sent off to Google.
                                                });
                                            }

                                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                            }).catch(console.error);


                                        }).catch((e) => {
                                            console.error(e);
                                            messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                            messageChain.delete(no);
                                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                                visitor.pageview(`/believeeducation/erroraddinginfo`, function (err) {
                                                    if (err) {
                                                        console.error(err);
                                                    }
                                                    // Handle the error if necessary.
                                                    // In case no error is provided you can be sure
                                                    // the request was successfully sent off to Google.
                                                });
                                            }).catch(console.error);

                                        });
                                    }


                                }).catch(console.error);
                            } else {
                                messageToSend = `It appears the picture was not downloaded properly please send the picture again`;
                                messageChain.delete(no);
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    visitor.pageview(`/believeeducation/erroraddingpicture`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch(console.error)
                            }


                        } else if (messages[0] === "@addstock") { // Save stock
                            if (query === "1") {

                                var now = new Date();
                                var start = new Date(now.getFullYear(), 0, 0);
                                var diff = now - start;
                                var oneDay = 1000 * 60 * 60 * 24;
                                var day = Math.floor(diff / oneDay);

                                let stock = new stockModel({
                                    date: now,
                                    dayOfTheYear: day,
                                    itemName: messages[1].toLowerCase().replace(/\s/g, ''),
                                    visibleName: messages[1],
                                    numberOfItems: parseInt(messages[2]),
                                    itemPrice: parseInt(messages[3]),
                                    members: [],
                                    no: no
                                });

                                stockService.addStock(stock).then((v) => {

                                    if (typeof v.dayOfTheYear === "number") {
                                        messageToSend = `Stock item added successfully, to add more send @addstock or click this link https://wa.me/${hiveBot}?text=@addstock`;
                                        visitor.pageview(`/addstock/stocksuccessfullyadded`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    } else {
                                        messageToSend = `It appears your stock was not added successfully, you can try again by sending @addstock or click this link https://wa.me/${hiveBot}?text=@addstock`;
                                        visitor.pageview(`/addstock/erroraddingstock`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }

                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);
                                }).catch(console.error);


                            } else if (query === "2") {
                                messageToSend = "This chat has been restarted";
                                messageChain.delete(no);
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            } else {
                                messageToSend = "This response is out of the expected one,please select between option 1 and 2, but if this is not what you want, send # to restart";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            }
                        } else { // outside of the expected options
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                                visitor.pageview(`/messagelength4/notexpected`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            }).catch(console.error);
                        }

                        break;
                    case 5:
                        if (messages[1] === "2" && messages[0] === "1073unashe") { // Registering asking for areas
                            messages.push(query);
                            messageChain.set(no, messages);
                            messageToSend = `Type a brief intro about your business,you can include in this, your unique services, your service history ,why clients should choose you, and what inspires you`;
                            if (messages[2] === "2") {
                                messageToSend = `Type a brief intro about yourself you can include in this, your unique skills, your work history ,why clients should choose you, and what inspires you`;
                            }
                            visitor.pageview(`/registration/areas`, function (err) {
                                if (err) {
                                    console.error(err);
                                }
                                // Handle the error if necessary.
                                // In case no error is provided you can be sure
                                // the request was successfully sent off to Google.
                            });

                        } else if (messages[0].substring(messages[0].indexOf("@"), messages[0].length).toLowerCase() === "@va" && messages[0].includes("@va")) {
                            messageChain.delete(no);
                            if (messages[1] === "2") { // confirm its services


                                if (messages[2] === "1") { // confirm its created a quotation
                                    let v = clientMap.get(no);
                                    messages.push(query);
                                    messageChain.set(no, messages);

                                    let filePath = `./${v.name} quotation ${pdfMap.get(no)}.pdf`;

                                    if (messages[4] === "1") { // Yes send now
                                        let mediaMessage = `${v.name} quotation ${pdfMap.get(no)}`;
                                        const media = MessageMedia.fromFilePath(filePath);

                                        client.sendMessage(no, media, { caption: mediaMessage }).catch(console.error);
                                        visitor.pageview(`/va/sendpdfquotation`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    } else if (messages[4] === "2") { // No delete
                                        //file removed
                                        fs.unlink(filePath, (err) => {
                                            if (err) {
                                                console.error(err)
                                                return
                                            }
                                            visitor.pageview(`/va/deletequotation`, function (err) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                // Handle the error if necessary.
                                                // In case no error is provided you can be sure
                                                // the request was successfully sent off to Google.
                                            });



                                        });
                                        messageToSend = "Thank you, the file is being deleted";
                                    } else {
                                        messageToSend = "Please select one of the options 1 or 2, e.g send 1 to get the generated pdf";
                                        visitor.pageview(`/va/quotation/notexpected`, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            // Handle the error if necessary.
                                            // In case no error is provided you can be sure
                                            // the request was successfully sent off to Google.
                                        });
                                    }
                                    messageChain.delete(no);

                                } else {
                                    messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                                    visitor.pageview(`/va/notexpected`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }
                            } else {
                                messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                                visitor.pageview(`/va/notexpected`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            }
                        } else {
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                            visitor.pageview(`/messagelength5/notexpected`, function (err) {
                                if (err) {
                                    console.error(err);
                                }
                                // Handle the error if necessary.
                                // In case no error is provided you can be sure
                                // the request was successfully sent off to Google.
                            });
                        }
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch(console.error);
                        break;
                    case 6:
                        if (messages[1] === "2" && messages[0] === "1073unashe") { // Registering finishing profile now VA

                            messages.push(query);
                            messageChain.set(no, messages);
                            messageToSend = "Please type the areas your are able to offer services in, include suburb and city separate each by a semicolon, e.g Avondale Harare; Epworth Harare";
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                                visitor.pageview(`/registration/areas`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            }).catch(console.error);

                        } else {
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                                visitor.pageview(`/messagelength6/notexpected`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            }).catch(console.error)
                        }

                        break;
                    case 7:
                        if (messages[1] === "2" && messages[0] === "1073unashe") { // Registered VA

                            messages.push(query);
                            messageChain.set(no, messages);
                            let milliSecondsSinceEpoch = new Date().valueOf().toString();

                            var category = "";

                            switch (messages[4]) {
                                case "1":
                                    category = "Administration, business and management";
                                    break;
                                case "2":
                                    category = "Animals, land and environment";
                                    break;
                                case "3":
                                    category = "Architecture";
                                    break;
                                case "4":
                                    category = "Computing and ICT";
                                    break;
                                case "5":
                                    category = "Construction and building";
                                    break;
                                case "6":
                                    category = "Design, arts and crafts";
                                    break;
                                case "7":
                                    category = "Education and training";
                                    break;
                                case "8":
                                    category = "Energy production services";
                                    break;
                                case "9":
                                    category = "Engineering";
                                    break;
                                case "10":
                                    category = "Facilities and property services";
                                    break;
                                case "11":
                                    category = "Farming, Fishing, and Forestry";
                                    break;
                                case "12":
                                    category = "Financial services";
                                    break;
                                case "13":
                                    category = "Garage services";
                                    break;
                                case "14":
                                    category = "Hairdressing and beauty";
                                    break;
                                case "15":
                                    category = "Healthcare";
                                    break;
                                case "16":
                                    category = "Heritage, culture and libraries";
                                    break;
                                case "17":
                                    category = "Hospitality, catering and tourism";
                                    break;
                                case "18":
                                    category = "Languages";
                                    break;
                                case "19":
                                    category = "Legal and court services";
                                    break;
                                case "20":
                                    category = "Manufacturing and production";
                                    break;
                                case "21":
                                    category = "Mining and extraction services";
                                    break;
                                case "22":
                                    category = "Performing arts and media";
                                    break;
                                case "23":
                                    category = "Print and publishing, marketing and advertising";
                                    break;
                                case "24":
                                    category = "Retail and customer services";
                                    break;
                                case "25":
                                    category = "Science, mathematics and statistics";
                                    break;
                                case "26":
                                    category = "Security, uniformed and protective services";
                                    break;
                                case "27":
                                    category = "Social sciences and religion";
                                    break;
                                case "28":
                                    category = "Social work and caring services";
                                    break;
                                case "29":
                                    category = "Sport and leisure";
                                    break;
                                case "30":
                                    category = "Transport, distribution and logistics";
                                    break;
                                default:
                                    category = "Administration, business and managemen";
                                    break;
                            }


                            if (messages[2] === "1") {
                                var worker = new Worker({
                                    name: messages[3].toLowerCase(),
                                    category: category,
                                    skills: messages[5],
                                    brief: messages[6],
                                    areas: messages[7],
                                    package: "7.99",
                                    expired: false,
                                    no: no,
                                    date: new Date(),
                                    id: milliSecondsSinceEpoch,
                                    urlName: messages[3].toLowerCase().replace(/\s/g, ''),
                                    url: `http://${messages[3].toLowerCase().replace(/\s/g, '')}.hive.co.zw`
                                });
                                visitor.pageview(`/registration/business`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            } else if (messages[2] === "2") {
                                messageChain.delete(no);
                                var worker = new Worker({
                                    name: messages[3].toLowerCase(),
                                    category: category,
                                    skills: messages[5],
                                    brief: messages[6],
                                    areas: messages[7],
                                    bids: 20,
                                    package: "0",
                                    expired: false,
                                    no: no,
                                    date: new Date(),
                                    id: milliSecondsSinceEpoch,
                                });
                                visitor.pageview(`/registration/freelancer`, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    // Handle the error if necessary.
                                    // In case no error is provided you can be sure
                                    // the request was successfully sent off to Google.
                                });
                            }

                            mongoWorker.saveWorker(worker).then((v) => {

                                if (!v.expired) {
                                    messageToSend = `Thank you for your patience, You account has been added to see all the available features for you send the keyword @instructions, or click the link https://263714020524?text=@instructions`;

                                } else {
                                    messageToSend = `It appears you there was an error saving your profile, could it be, that there is already an account saved on this account? If not, kindly try again later, but if the error persists, please contact us by clicking https://wa.me/${contactUs}?text=Hi+Hive+It+appears+there+was+an+error+creating+my+account`;
                                }

                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                }).catch(console.error);


                            }).catch((e) => {
                                console.error(e);
                                messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                messageChain.delete(no);
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    visitor.pageview(`/registration/errorsavingworker`, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        // Handle the error if necessary.
                                        // In case no error is provided you can be sure
                                        // the request was successfully sent off to Google.
                                    });
                                }).catch(console.error);

                            });




                        } else {
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                            visitor.pageview(`/messageslength7/notexpected`, function (err) {
                                if (err) {
                                    console.error(err);
                                }
                                // Handle the error if necessary.
                                // In case no error is provided you can be sure
                                // the request was successfully sent off to Google.
                            });
                        }
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch(console.error);
                        break;
                    case 8: // END HERE , stuff below is to for refferences
                        messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                        messageChain.delete(no);
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                            visitor.pageview(`/outsideoflength/`, function (err) {
                                if (err) {
                                    console.error(err);
                                }
                                // Handle the error if necessary.
                                // In case no error is provided you can be sure
                                // the request was successfully sent off to Google.
                            });
                        }).catch(console.error);
                        break;
                    default:
                        messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                        messageChain.delete(no);
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                            messageChain.delete(no);
                            visitor.pageview(`/default`, function (err) {
                                if (err) {
                                    console.error(err);
                                }
                                // Handle the error if necessary.
                                // In case no error is provided you can be sure
                                // the request was successfully sent off to Google.
                            });
                        }).catch(console.error);
                        break;
                }

            } else { // user has not communicated yet, welcome them

                messages.push("1073unashe");
                messageChain.set(no, messages);
                messageToSend = `Hi there ${name}, welcome to Hive Enterprise Solution 😊. \n\n \n*1* Search for a service \n*2* Register \n*3* Want to know more?   \n\nSend the number of the option you want, e.g send 2 if you want to register as a service provider`;

                client.sendMessage(msg.from, messageToSend).then((res) => {

                    visitor.pageview("/welcomemessage", function (err) {
                        if (err) {
                            console.error(err);
                        }
                        // Handle the error if necessary.
                        // In case no error is provided you can be sure
                        // the request was successfully sent off to Google.
                    });
                }).catch(console.error);

            }

        }




    }










});







// My useful functions

const checkPayment = no => {
    let day = dayOfYear(new Date);
    try {
        return paymentService.checkSubscriptionStatus(no, day)
    } catch (e) {
        console.error(e);
    }
}

const dayOfYear = date =>
    Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);

const isValidPhoneNumber = p => {
    var sentences = p.split(/\r?\n/);
    for (let i = 0; i < sentences.length; i++) {
        var phoneRe = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
        var digits = sentences[i].replace(/\D/g, "");
        if (phoneRe.test(digits)) {
            return phoneRe.test(digits);
        }
    }

    return false;
}

const getAllPeopleWhoMessagedUs = async () => {

    var chats = await client.getChats();
    chats.forEach((elem) => {
        console.log(elem);
        // firebase.addVisitor(elem.id._serialized, elem.id.date);
        // if (elem.unreadCount > 0 && !elem.isGroup) {
        //     client.sendMessage(elem.id._serialized, "Introducting Gigz, connecting people building dreams, there was a network error, please restart by typing hie").catch(console.error);
        // }
    });



}

client.on('status@broadcast', async status => {
    delete (status);
});









app.use(cors());


app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(express.json());

app.post('/api/v1/message', (req, res) => {

    var contacts = req.body.contacts.split(",");
    contacts.forEach(element => {

        var id = `263${element}@c.us`;
        client.sendMessage(id, req.body.message).then(() => {
            console.log(`Sent message to ${element}`);
        }).catch(console.error);


    });

    res.send("hi");



});

app.post('/api/v1/checkpayments', async (req, res) => {

    var clients = await paymentService.getAllPayments();
    clients.forEach(element => {

        let id = element.no;
        checkPayment(id).then((oneClient) => {

            let statement = "";
            if (!oneClient.expired && checkPayment(id).days < 6) {
                statement = `only ${days} left`;
            } else if (oneClient.expired) {
                statement = `expired`;
            }
            var messageToSend = `Good day \nKindly note your subscription has , ensure you resubscribe soon so you *continue* to get full access to our services and say guard your unique username, which maybe taken by someone else if the account is not in use for a long time`;
            client.sendMessage(id, messageToSend).then(() => {
                console.log(`Sent to ${element.no}`);
            }).catch(console.error);
        }).catch(console.error);


    });


});





app.listen(port, () => {
    console.log("Server Running Live on Port : " + port);
});
