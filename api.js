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
const workerService = require("./services/workerService.js");
const { url } = require("inspector");
const reviewsModel = require("./models/reviewsModel");
const portfolioModel = require("./models/portfolioModel");
const QGenerator = require('./services/qGenerator');


initConnection();


process.title = "whatsapp-node-api";
global.client = new Client({ qrTimeoutMs: 0, puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--unhandled-rejections=strict'] } });
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





var sentMessages = 0;


client.on('ready', async () => {
    console.log('Gigz is running!');


});



client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});



var messageChain = new Map();
var invoice = new Date().getTime().toString();
const zwlPrice = 600;
var pollUrl = "";
var seenProfilesMap = new Map();
var clientMap = new Map();
var attachmentData = {};

client.on('message', async msg => {

    // const no = msg.from;
    // var messages = [];
    // const invoiceData = {
    //     addresses: {
    //         shipping: {
    //             name: 'John Doe',
    //             address: '2400 Fulton Street',
    //             city: 'San Francisco',
    //             state: 'CA',
    //             country: 'US',
    //             postalCode: 94118
    //         },
    //         billing: {
    //             name: 'John Doe',
    //             address: '2400 Fulton Street',
    //             city: 'San Francisco',
    //             state: 'CA',
    //             country: 'US',
    //             postalCode: 94118
    //         }
    //     },
    //     memo: 'As discussed',
    //     items: [{
    //         itemCode: 12341,
    //         description: 'Laptop Computer',
    //         quantity: 2,
    //         price: 3000,
    //         amount: 6000
    //     }, {
    //         itemCode: 12342,
    //         description: 'Printer',
    //         quantity: 1,
    //         price: 2000,
    //         amount: 2000
    //     }
    //     ],
    //     subtotal: 8000,
    //     paid: 0,
    //     qNumber: 1234,
    //     dueDate: `${new Date().getMonth() + 1}/${new Date().getDate()}/${new Date().getFullYear()}`
    // }

    // const qg = new QGenerator(invoiceData)
    // qg.generate();
    // messages.push("1");
    // if (!messageChain.has(no)) {
    //     messageChain.set(no, messages);
    // }


    // if (messageChain.has(no) && ) {
    // const media = MessageMedia.fromFilePath(`./Quotation 1234.pdf`);
    // client.sendMessage(msg.from, media, { caption: "Test Document" }).catch(console.error);
    // }




    // Check for media
    if (msg.hasMedia) {
        attachmentData = await msg.downloadMedia();
    }







    /// A unique identifier for the given session
    // const sessionId = randomString({ length: 20 });
    const query = msg.body;
    const no = msg.from;



    const user = await msg.getContact();

    var name = user.pushname;
    if (name === undefined || name === Object.keys(user).length === 0) {
        name = "";
    }


    // array message
    var messageToSend = "";
    var messages = [];


    if (msg.from.length < 23 && msg.from.includes("@c")) {


        if (query.substring(query.indexOf("@"), query.length).toLowerCase() === "@va" && query.includes("@va")) { // Virtual Assistant channel
            messageChain.delete(no);
            let businessName = query.substring(0, query.indexOf("@va"))
            mongoWorker.checkName(businessName).then((r) => {

                if (r === null) {
                    messageToSend = `Pleasant ${timeOfDay} ${name}, it appears that Virtual Assistant is no longer operational, kindly contact the person who gave you the link to find out if it is still operational`;
                    messageChain.delete(no);
                } else {
                    clientMap.set(no, r);
                    messages.push(query);
                    messageChain.set(no, messages);
                    var timeOfDay = "";
                    if (new Date().getHours() < 12) {
                        timeOfDay = "Morning";
                    } else if (new Date().getHours() > 12 && new Date().getHours() < 16) {
                        timeOfDay = "Afternoon";
                    } else {
                        timeOfDay = "Day";
                    }

                    messageToSend = `Pleasant ${timeOfDay} ${name}, welcome to ${businessName}'s Virtual Assistant \n\n \n*1* About ${businessName} \n*2* See services \n*3* Frequently asked questons   \n\nSend the number of the option you want, e.g send 2 if you want to see ${businessName}'s services`;
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {

                }).catch(console.error);
            }).catch(console.error);







        } else if (query === "#") { // Restart coversation
            messageToSend = "You have restarted.\nType hi message to continue or click link below \nhttps://wa.me/263713020524?text=hie";
            messageChain.delete(no);

            client.sendMessage(msg.from, messageToSend).then((res) => {
                // console.log("Res " + JSON.stringify(res));
            }).catch((e) => {
                console.error(e);
                messageToSend = "Oooops looks like there was an error, please try again, by sending a new message ";

                client.sendMessage(msg.from, messageToSend).then((res) => {
                    // console.log("Res " + JSON.stringify(res));
                }).catch((console.error));
            });
        } else if (query.substring(query.indexOf('@') + 1, query.length) === "profile" && query.substring(0, query.indexOf('@')).length === 13) {
            messageChain.delete(no);
            var id = query.substring(0, query.indexOf('@'));
            mongoWorker.getWorkerById(id).then((v) => {
                if (v.package === "7.99") {
                    website = `${v.name}.gigz.co.zw`;
                }
                messageToSend = `Name: ${v.name} \nBrief Intro:${v.brief} \nServices: ${v.skills} \nAreas able to serve: ${v.areas} \nTo see their reviews click \nhttps://wa.me/263713020524?text=${v.name}@reviews \nTo chat to their virtual assistant click \nhttps://wa.me/263713020524?text=${v.name}@va   ${website} \n_Contact_: https://wa.me/${el.no.substring(0, el.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Gigz+I+am+interested+in+your+services`;
                client.sendMessage(v.no, messageToSend).then((res) => {
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
        } else if (query.toLowerCase() === "subscribe") { // subscribe to service
            messageChain.delete(no); //Ensure all previous messages are deleted
            messages.push(query);
            messageChain.set(no, messages);
            messageToSend = "Please select the package you would like to subscribe to \n\n \n*1* Profile and Virtual Assistant for 5.99USD p.m only \n*2* Profile , Virtual Assistant and Web page for 7.99USD p.m \n*3* Custom solution to improve your services  \n\nTo choose any option send a number eng. 2 to get pay for a Profile, Virtual Assistant and a Web page \n\nTerms and Conditions Apply, to see them send Terms or click this link https://wa.me/263713020524?text=terms";

            client.sendMessage(msg.from, messageToSend).then((res) => {
                // console.log("Res " + JSON.stringify(res));
            }).catch((console.error));
        } else if (query.toLowerCase() === "terms") {
            messageChain.delete(no);
            messageToSend = "Terms";
            client.sendMessage(msg.from, messageToSend).then((res) => {
                // console.log("Res " + JSON.stringify(res));
            }).catch((console.error));
        } else if (query.substring(query.indexOf('@') + 1, query.length) === "portfolio" && query.includes("@portfolio")) {
            messageChain.delete(no);
            messages.push(query);
            messageChain.set(no, messages);
            messageToSend = "You want to add to your portfolio which showcases the work you have done, great, we take one picture per description, we advise you to post *only the best pictures*";
            client.sendMessage(msg.from, messageToSend).then((res) => {
                // console.log("Res " + JSON.stringify(res));
            }).catch((console.error));
        } else if (query.substring(query.indexOf('@') + 1, query.length) === "pic" && query.substring(0, query.indexOf('@')).length === 13) {
            messageChain.delete(no);
            messages.push(query);
            messageChain.set(no, messages);
            messageToSend = "You want to add your picture, great, send your picture now";
            client.sendMessage(msg.from, messageToSend).then((res) => {
                // console.log("Res " + JSON.stringify(res));
            }).catch((console.error));
        } else if (query.substring(query.indexOf('@') + 1, query.length) === "rate" && query.includes("@rate")) { // rate or put recommendations
            messageChain.delete(no);
            let username = query.substring(0, query.indexOf('@'));
            mongoWorker.checkName(username).then((v) => {

                if (v === null) {
                    messageToSend += `We do not appear to have this user in our database, please ask them again, and try again`;
                } else {
                    messages.push(query);
                    messageChain.set(no, messages);
                    messageToSend += `Thank you for rating the service you got, on a scale of 1 to 5, how would you rate the service you got, you can only type a number between 1 and 5`;
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {

                }).catch(console.error);

            }).catch(console.error);

        } else {

            if (messageChain.has(no)) { // check if user is already in communication
                messages = messageChain.get(no);

                switch (messages.length) { // looking to get the context of the current conversation
                    case 1:
                        if (messages.length > 2) {
                            messageToSend = "Our apology there was a network error, kindly try again, type # to restart";
                            messageChain.delete(no);
                            client.sendMessage(msg.from, messageToSend).then((res) => {

                            }).catch(console.error);
                        } else {
                            if (messages[0] === "subscribe") {

                                if (query === "3") {
                                    messageToSend = "Please send click this link https://wa.me/263719066282?text=Hi+Gigz+I+want+a+custom+software+solution+for+my+business";

                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        messageChain.delete(no);
                                    }).catch((console.error));


                                } else {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    messageToSend = "Please send the Ecocash number you are using to pay, e.g 0771123123 our system works just like the system in the supermarket, after you put in your phone number it will send you a prompt to pay on your phone";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch((console.error));
                                }
                            } else if (messages[0].substring(messages[0].indexOf("@"), messages[0].length).toLowerCase() === "@va" && messages[0].includes("@va")) {

                                let v = clientMap.get(no);
                                if (query === "1") { // About
                                    let website = "";
                                    if (v.package === "7.99") {
                                        website = `${v.name}.gigz.co.zw`;
                                    }
                                    messageToSend = `Name: ${v.name} \nBrief Intro:${v.brief} \nServices: ${v.skills} \nAreas able to serve: ${v.areas} \nTo see their reviews click \nhttps://wa.me/263713020524?text=${v.name}@reviews \nTo chat to their virtual assistant click \nhttps://wa.me/263713020524?text=${v.name}@va   ${website} \n_Contact_: https://wa.me/${el.no.substring(0, el.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Gigz+I+am+interested+in+your+services`;
                                } else if (query === "2") { // Services 
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    let servicesPrices = v.prices.split(",");
                                    messageToSend = `${name}'s Services and costs \n\n`;
                                    for (let index = 0; index < servicesPrices.length; index++) {
                                        const element = servicesPrices[index];
                                        messageToSend += `${index + 1} ${element.substring(0, element.indexOf("="))}  ${element.substring(element.indexOf("=") + 1, element.length)}}\n\n`;
                                    }
                                    messageToSend += `____________END___________`;
                                    messageToSend += `Select one of the options below  \n*1* Create a quotation \n*2* See work done before  \n*3* To see reviews \n_Contact_: https://wa.me/${el.no.substring(0, el.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Gigz+I+am+interested+in+your+services`;
                                } else if (query === "3") { // FAQs
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                } else {
                                    messageToSend = "This response is out of the expected one, please select one of the options 1 or 2 or 3 , if this is not what you type # to restart";
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));
                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length) === "rate" && messages[0].includes("@rate")) {
                                if (parseInt(query) + 1 < 6 && parseInt(query) + 1 > 1) {
                                    messageToSend = "It appears you have put in a number that is not between 1 and 5, please only enter a number between those numbers";
                                } else {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    messageToSend = "Thank you sending in your rating, can you type briefly about your experience with this service";
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {

                                }).catch((err) => {
                                    console.log("Error on client welcome message => " + err)
                                });
                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length) === "pic" && messages[0].substring(0, messages[0].indexOf('@')).length === 13) {
                                //TODO Add file to firebase
                                let imageUrl = "";
                                let businessName = messages[0].substring(0, messages[0].indexOf('@'));

                                mongoWorker.addPicture(no, imageUrl).then((r) => {
                                    //TODO check is was added successfully
                                    messageToSend = `Your display picture was added successfully, if you want to change it, you can do so by clicking https://263713020524?text=${businessName}@pic`;
                                    messageChain.delete(no);
                                    client.sendMessage(msg.from, messageToSend).then((res) => {

                                    }).catch(console.error);
                                }).catch(console.error);

                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length) === "portfolio" && messages[0].includes("@portfolio")) {
                                if (attachmentData.data.length > 0) {
                                    messageToSend = "Thank you for sending your picture, please type a bried description about the picture, here you could include what is in the picture, and/or the prices and/or the quality of work done, and how long it took you to have it done";
                                } else {
                                    messageToSend = "It appears you did not send a picture, please ensure that you send a picture, the best of what you have, because this helps you get clients, if this is not what you want to do you can type # to restart";
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {

                                }).catch(console.error);
                            } else if (query === "1") {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = "Please send the service you are looking for or the service providers occupation e.g  carpenter OR I need someone to help me find accommodation  \n\nTerms and Conditions Apply to see them send term or click this link https://263713020524?text=terms";

                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));
                            } else if (query === "2") {

                                paymentService.checkSubscriptionStatus(no).then((v) => {
                                    if (v.expired || v === null) {
                                        messageToSend = "It appears you are yet to subscribe, please type subscribe or click this link https://wa.me/263713020524?text=subscribe";
                                    } else {
                                        var clientArr = [v.package];
                                        clientMap.set(no, clientArr);
                                        messages.push(query);
                                        messageChain.set(no, messages);
                                        messageToSend += `Please answer the next few questions, you will only be asked once, they help to market your services, so be honest and take them seriously \nPlease tell us your full name or the name of your business (this has to be unique, if it was already taken you will be asked again), \n\nIf this is not what you want type # to restart`;
                                    }
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch((console.error));
                                })

                            } else if (query === "3") {
                                messages.push("subscribe");
                                messageChain.set(no, messages);
                                messageToSend = "Please select the option you would like \n\n \n*1* What is Gigz? \n*2* Frequently Asked Questions \n*3* Terms and Conditions  \n\nTo choose any option send a number eng. 2 to get pay for a Profile, Virtual Assistant and a Web page ";

                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));
                            } else {
                                messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                                messageChain.delete(no);
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));
                            }
                        }


                        break;
                    case 2:
                        if (messages.length > 3) {
                            messageToSend = "Our apology there was a network error, kindly try again";
                            messageChain.delete(no);
                            client.sendMessage(msg.from, messageToSend).then((res) => {

                            }).catch(console.error);

                        } else {
                            if (messages[1] === "1") {

                                var seenProfiles = [];
                                mongoWorker.getWorkers(query, 0).then((r) => {

                                    if (r.length > 0) {
                                        messageToSend += "Available service providers right now\n\n";
                                        r.forEach((el) => {
                                            messageToSend += `Name: *${el.name}* \nServices: *${el.skills}* \n_See Profile_:  https://wa.me/263713020524?text=${el.id}@profile \n_Contact_: https://wa.me/${el.no.substring(0, el.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Gigz+I+am+interested+in+your+services \n\n`;
                                            seenProfiles.push(el);
                                        });
                                        seenProfilesMap.set(no, seenProfiles);
                                        messageToSend += "_________________END_________________\n";
                                        messageToSend += `Please select one of the option below \n1)To see the next services providers \n\nType # to restart  \n\n${mainAd}`;
                                    } else {
                                        messageToSend += `It appears there are no service providers that match your search at the moment, please try again tomorrow, or try searching using another term we have over 100 service providers already registered`;
                                        messageChain.delete(no);
                                    }

                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);

                                }).catch(console.error);




                            } else if (messages[1] == "2") {
                                mongoWorker.checkName(query).then((v) => {

                                    if (v === null) {
                                        messages.push(query);
                                        messageChain.set(no, messages);
                                        messageToSend += `Please select the category of your services by typing the number of the category e.g 3,or clicking the link below it \n\n1)Administration, business and management\nhttps://wa.me/263713020524?text=1 \n\n2)Animals, land and environment\nhttps://wa.me/263713020524?text=2 \n\n3)Architecture\nhttps://wa.me/263713020524?text=3 \n\n4)Computing and ICT\nhttps://wa.me/263713020524?text=4 \n\n5)Construction and building\nhttps://wa.me/263713020524?text=5 \n\n6)Design, arts and crafts\nhttps://wa.me/263713020524?text=6 \n\n7)Education and training\nhttps://wa.me/263713020524?text=7 \n\n8)Energy production services\nhttps://wa.me/263713020524?text=8 \n\n9)Engineering\nhttps://wa.me/263713020524?text=9  \n\n10)Facilities and property services\nhttps://wa.me/263713020524?text=10 \n\n11)Farming, Fishing, and Forestry\nttps://wa.me/263713020524?text=11 \n\n12)Financial services\nhttps://wa.me/263713020524?text=12 \n\n13)Garage services\nhttps://wa.me/263713020524?text=13  \n\n14)Hairdressing and beauty https://wa.me/263713020524?text=14 \n\n15)Healthcare\nhttps://wa.me/263713020524?text=15  \n\n16)Heritage, culture and libraries\nhttps://wa.me/263713020524?text=16  \n\n17)Hospitality, catering and tourism \nhttps://wa.me/263713020524?text=17 \n\n18)Languages \nhttps://wa.me/263713020524?text=18 \n\n19)Legal and court services\nhttps://wa.me/263713020524?text=19 \n\n20)Manufacturing and production\nhttps://wa.me/263713020524?text=20 \n\n21)Mining and extraction services\nhttps://wa.me/263713020524?text=21  \n\n22)Performing arts and media \nhttps://wa.me/263713020524?text=22   \n\n23)Print and publishing, marketing and advertising \nhttps://wa.me/263713020524?text=23  \n\n24)Retail and customer services\nhttps://wa.me/263713020524?text=24  \n\n25)Science, mathematics and statistics \nhttps://wa.me/263713020524?text=25 \n\n26)Security, uniformed and protective services \nhttps://wa.me/263713020524?text=26 \n\n27)Social sciences and religion\nhttps://wa.me/263713020524?text=27 \n\n28)Social work and caring services\nhttps://wa.me/263713020524?text=28 \n\n29)Sport and leisure \nhttps://wa.me/263713020524?text=29 \n\n30)Transport, distribution and logistics\nhttps://wa.me/263713020524?text=30  \n\n#) Restart(type # to restart)`;
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch(console.error);
                                    } else {
                                        messageToSend = "This name is already taken please try another name or structure it differently"
                                    }
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch((console.error));

                                });
                            } else if (messages[1] == "3") {
                                if (query === "1") {
                                    messageToSend = "Gigz is a platform for service providers, it helps them market their services and gives them tools to improve their servive, while at the same time helping people who are searching for services get them conviniently, excellenctly and reliably";
                                } else if (query === "2") {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    messageToSend = "Please send the number of the option you want \n\n*1* I am looking for a service what do I do? \n*2* How do I register as a service provider? \n*3* What is a Virtual Assistant?  \n*4* What is a Web Page?   \n*5* Send a question";
                                } else if (query === "3") {
                                    messageToSend = "Terms and Conditions as at 1 April 2022 \n\n";
                                } else {
                                    messageToSend = "You were looking at FAQs, but sent something outside the options, so the chat has restarted, you can type hi now";
                                    messageChain.delete(no);
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));

                            } else if (messages[0] === "subscribe") {

                                if (isValidPhoneNumber(query)) {
                                    //Initiating paynow

                                    const paynow = new Paynow("4114", "857211e6-052f-4a8a-bb42-5e0d0d9e38e7");
                                    let payment = paynow.createPayment(invoice, "anelesiwawa@gmail.com");

                                    let package = 0;
                                    if (messages[1] = 1) {
                                        package = 5.99;
                                    } else {
                                        package = 7.99;
                                    }
                                    let amount = 1;//zwlPrice * package;
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

                                        } else {
                                            messageToSend += "It appears there was an error, please type your number again, to retry   \n\nYou can Restart(type *#* to restart) ";
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
                                    messageToSend = "It appears you did not enter a valid phone number, please check the number and send again";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch((console.error));
                                }
                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length) === "rate" && messages[0].includes("@rate")) {

                                let businessName = messages[0].substring(0, messages[0].indexOf('@'));
                                let newReview = new reviewsModel({
                                    review: query,
                                    name: businessName,
                                    stars: messages[2],
                                    reviewer_no: no,
                                });

                                mongoWorker.addReview(newReview).then((r) => {

                                    if (r === null) {
                                        messageToSend = "It seems you already rated this service provider, we only allow you to rate a service provider once";
                                    } else {
                                        messageToSend = "Thank you for leaving a review of the service you got, this will help someone else when they are interested in working with this person";
                                    }
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);

                                }).catch(console.error);
                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length) === "portfolio" && messages[0].includes("@portfolio")) {
                                //TODO Add file to firebase
                                let imageUrl = "";
                                let businessName = messages[0].substring(0, messages[0].indexOf('@'));
                                let portfolio = new portfolioModel({
                                    name: businessName,
                                    no: no,
                                    imageUrl: imageUrl,
                                    description: query,
                                    date: new Date(),
                                })
                                mongoWorker.addPortfolio(portfolio).then((r) => {
                                    //TODO check is was added successfully
                                    messageToSend = `Your image was added to your portfolio successfully, you can add more, we encourage you to do so, by clicking https://263713020524?text=${businessName}@portfolio`;
                                    messageChain.delete(no);
                                    client.sendMessage(msg.from, messageToSend).then((res) => {

                                    }).catch(console.error);
                                }).catch(console.error);
                            } else if (messages[0].substring(messages[0].indexOf("@"), messages[0].length).toLowerCase() === "@va" && messages[0].includes("@va")) {

                                if (messages[1] === "2") {

                                    if (query === "1") {
                                        messages.push(query);
                                        messageChain.set(no, messages);
                                        let servicesPrices = v.prices.split(",");
                                        messageToSend = `${name}'s Services and costs \n\n`;
                                        for (let index = 0; index < servicesPrices.length; index++) {
                                            const element = servicesPrices[index];
                                            messageToSend += `${index + 1} ${element.substring(0, element.indexOf("="))}  ${element.substring(element.indexOf("=") + 1, element.length)}}\n\n`;
                                        }
                                        messageToSend += `____________END___________`;
                                        messageToSend += `Type the number of each of the services you want separated by a comma  and send e.g 1,2,3  for services 1 and 2 and 3 \nOR \n2,4,6 for services 2 and 4 and 6 `;
                                    } else {

                                    }

                                } else {
                                    messageToSend = `It appears you did not select one of the available options, please select option 1 or 2 or 3`;
                                    client.sendMessage(msg.from, messageToSend).then((res) => {

                                    }).catch(console.error);
                                }
                            } else {
                                messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                                messageChain.delete(no);
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            }
                        }


                        break;
                    case 3:
                        if (messages[1] === "1") {
                            if (query === "1") {
                                var seenProfiles = seenProfilesMap.get(no).length;
                                mongoWorker.getWorkers(query, seenProfiles).then((r) => {

                                    if (r.length > 0) {
                                        messageToSend += "Available service providers right now\n\n";
                                        r.forEach((el) => {
                                            messageToSend += `Name: *${el.name}* \nServices: *${el.skills}* \n_See Profile_:  https://wa.me/263713020524?text=${el.id}@profile \n_Contact_: https://wa.me/${el.no.substring(0, el.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Gigz+I+am+interested+in+your+services \n\n`;
                                            seenProfiles.push(el);
                                        });
                                        seenProfilesMap.set(no, seenProfiles);
                                        messageToSend += "_________________END_________________\n";
                                        messageToSend += `Please select one of the option below \n1)To see the next services providers \n\nType # to restart `;
                                    } else {
                                        messageToSend += `It appears there are not any more service providers that match your search at the moment, please try again tomorrow, or try searching using another term we have over 100 service providers already registered`;
                                        messageChain.delete(no);
                                    }

                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);

                                }).catch(console.error);
                            } else {
                                messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                                messageChain.delete(no);
                            }

                        } else if (messages[1] == "2") {
                            messages.push(query);
                            messageChain.set(no, messages);
                            messageToSend += "Please type your services, separate each service by a comma,  e.g cooking, dancing, web development,decor, grooming and etiquitte, \n\nIf this is not what you want type # to restart ";
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);

                        } else if (messages[1] == "3") {
                            if (messages[2] === 2) {
                                if (query === "1") {
                                    messageToSend = "There are several ways to search for a service, you can go on our simple website gigz.co.zw and enter the service or service provider you are looking for and click enter, results will pop up *OR* you can service on this whatsapp system, to search from this point type # to restart, then type hi, and after the welcome message, then send 1 and after the question type the service or service provider you are looking for, \n\nIT IS FREE TO USE";
                                } else if (query === "2") {
                                    messageToSend = "To register you need to have subscribe, after you subscribe, on the welcome screen send 2, to register, and select one the options of the packages available now, and answer the questions that follow, please ensure you follow the formats mentioned for best results";
                                } else if (query === "3") {
                                    messageToSend = "A virtual assistant is a Whatsapp with automated responses sometimes refered to as Whatsapp Bot, Gigz is an example of such, when you create a profile you get to create one for your services, so clients can see your prices, see Frequently asked questions, and even get a quotation in pdf format, with a virtual assistant you can concentrate on your work, while it works for you";
                                } else if (query === "4") {
                                    messageToSend = "Gigz web page is a online site for your services, it would be found on [yourname].gigz.co.zw , and is really a website without the extra costs of a domain and hosting, and new ways of showing your website will be added weekly, ";
                                } else {
                                    messageToSend = "This response is out of the expected one, Please send one of the options indicated above 1 or 2 or 3 or 4";

                                }

                            } else {
                                messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                                messageChain.delete(no);
                            }
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch((console.error));

                        } else if (messages[0] === "subscribe") {
                            if (query.toLowerCase() === "paid") {
                                let status = await axios.get(pollUrl);
                                if (status.data.includes("status=Paid") || status.data.includes("status=Awaiting Delivery") || status.data.includes("status=Delivered")) {

                                    let package = 0;
                                    if (messages[1] = 1) {
                                        package = 5.99;
                                    } else {
                                        package = 7.99;
                                    }
                                    let amount = zwlPrice * package;

                                    let payment = new Payment({
                                        package: package,
                                        amount: amount,
                                        numberUsedInPayment: messages[2],
                                        no: no,
                                        date: new Date(),
                                        dayOfYear: dayOfYear(new Date()),
                                        valid: true
                                    })
                                    paymentService.addPayment(payment).then((v) => {
                                        messageToSend = "Your payment was successful valid for the next 30 days added to your account \n\nRestart(type *#* to restart) ";
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch(console.error);
                                    }).catch((e) => {
                                        console.log(e);
                                        messageToSend = "Oooops looks like there was an error, please try again, by sending a new message ";
                                        messageChain.delete(no);
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch(console.error);
                                    });
                                } else if (status.data.includes("status=Sent")) {
                                    messageToSend += "It is taking a bit more time to confirm your payment, please wait 2 minutes and type paid again \n\nRestart(type *#* to restart) ";
                                    client.sendMessage(no, messageToSend).then((res) => {
                                        // console.error("Res " + JSON.stringify(res));
                                    }).catch(console.error);

                                } else {
                                    messageToSend += "It appears your payment was not successful,kindly contact the team if you paid, so we can credit your account,to contact us, type # and after the welcome message, type 3, to send a report \nYou can Restart(type *#* to restart) ";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);
                                }
                            } else {
                                messageToSend = "It appears you sent something that is outside our understand, did you want to confirm payment, send paid or click this link https://wa.me/263713020524?text=paid, if this is not what you want type # to restart";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));
                            }
                        } else if (messages[0].substring(messages[0].indexOf("@"), messages[0].length).toLowerCase() === "@va" && messages[0].includes("@va")) {

                            if (messages[1] === "1") {


                                if (messages[2] === "1") {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    let servicesPrices = query.split(",");     // This is wrong
                                    messageToSend = `Services you chose \n\n`; // Make allowance for more than one service
                                    for (let index = 0; index < servicesPrices.length; index++) {
                                        const element = servicesPrices[index];
                                        messageToSend += `${index + 1} ${element.substring(0, element.indexOf("="))}  ${element.substring(element.indexOf("=") + 1, element.length)}}\n\n`;
                                    }
                                    messageToSend += `____________END___________`;
                                    messageToSend += `Please confirm these are the services you wanted and send \n*1* Yes, these are the services I want *2* No, let me resend the services I want`;
                                } else {

                                }

                            } else {
                                messageToSend = `It appears you did not select one of the available options, please select option 1 or 2 or 3`;
                                client.sendMessage(msg.from, messageToSend).then((res) => {

                                }).catch(console.error);
                            }
                        } else {
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);
                        }
                        break;
                    case 4:
                        if (messages[1] == "2") {
                            messages.push(query);
                            messageChain.set(no, messages);
                            messageToSend = "Type a brief intro about yourself or your business,you to include in this, your unique services, your service history ,why clients should choose you, and what inspires you";
                        } else if (messages[0].substring(messages[0].indexOf("@"), messages[0].length).toLowerCase() === "@va" && messages[0].includes("@va")) {

                            if (messages[1] === "1") {


                                if (messages[2] === "1") {


                                    if (query === "1") { // Yes these are the services I want
                                        // Send pdf here

                                    } else if (query === "2") {
                                        messageChain.set(no, messages.pop());
                                        let servicesPrices = query.split(",");
                                        messageToSend = `Okay let us do this again \n\n`;
                                        for (let index = 0; index < servicesPrices.length; index++) {
                                            const element = servicesPrices[index];
                                            messageToSend += `${index + 1} ${element.substring(0, element.indexOf("="))}  ${element.substring(element.indexOf("=") + 1, element.length)}}\n\n`;
                                        }
                                        messageToSend += `____________END___________`;
                                        messageToSend += `Type the number of each of the services you want separated by a comma(if you want more than one of the same service, you can list it as many times as you want it)  and send e.g 1,2,3  for services 1 and 2 and 3 \nOR \n2,4,6 for services 2 and 4 and 6 `;
                                    } else {
                                        messageToSend = `It appears you did not select one of the available options, please select option 1 or 2 `;
                                        client.sendMessage(msg.from, messageToSend).then((res) => {

                                        }).catch(console.error);
                                    }

                                } else {

                                }

                            } else {
                                messageToSend = `It appears you did not select one of the available options, please select option 1 or 2 or 3`;
                                client.sendMessage(msg.from, messageToSend).then((res) => {

                                }).catch(console.error);
                            }

                        } else {
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                        }
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch(console.error); s
                        break;
                    case 5:
                        if (messages[1] == "2") {
                            messages.push(query);
                            messageChain.set(no, messages);
                            messageToSend = "Please type the areas your are able to offer services in, include suburb and city, e.g Avondale, Harare, Epworth Harare";
                        } else {
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                        }
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch(console.error);
                        break;
                    case 6:
                        if (messages[1] == "2") {
                            messages.push(query);
                            messageChain.set(no, messages);
                            messageToSend = "Thank you for your patience in creating your profile, we need just two more answers for your Virtual Assistant, please list all your services and the price for each separated by a comma in this format descr=amount and send them, all the you services listed above e.g website deveopmen=100USD, Mobile Application development=300USD \nOR \nMoving goods local(in town)=10USD,Moving goods above 2T=45USD \nOR \nPedicure=7USD,Manicure=10USD";
                        } else {
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                        }
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch(console.error)
                        break;
                    case 7:
                        if (messages[1] == "2") {
                            let servicesArray = query.split(",");
                            if (servicesArray.length < 1 || servicesArray === null) {
                                messageToSend = "It appears you did not list your services the right way, please follow these instructions , we need just two more answers for your Virtual Assistant, please list all your services and the price for each separated by a comma in this format descr=amount and send them, all the you services listed above e.g website deveopmen=100USD, Mobile Application development=300USD \nOR \nMoving goods local(in town)=10USD,Moving goods above 2T=45USD \nOR \nPedicure=7USD,Manicure=10USD";

                            } else {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = `These are your services and prices, your Virtual Assistant will use this to send quotations to people \n`;
                                for (let index = 0; index < serviceArray.length; index++) {
                                    const element = serviceArray[index];
                                    messageToSend += `${index + 1} ${element.substring(0, element.indexOf("="))}  ${element.substring(element.indexOf("=") + 1, element.length)}}\n\n`;
                                }
                                messageToSend += `Please confirm these are your services and the prices are correct \n*1* Yes, it is correct \n*2* Not correct, can I retype them \nSend the number that shows the option you want e.g 1 to confirm these are correct `;
                            }
                        } else {
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                        }
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch(console.error);
                        break;
                    case 8:
                        if (messages[1] == "2") {
                            if (query === "1") {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = "One last question, your clients, might have questions, please help them get answers quickly, by sending frequently asked questions in the format question=answer separate each by a comma e.g Do you do house calls?=yes,how much is pedicure if I have my own nails?=To ensure quality we use only our nails which we know the source and works well together the rest of our tools \nOR \nHow secure is your website?=It is very secure and even protected from bots,How long does it take to make a mobile application on average?=It takes 3 weeks for a basic application more complex apps might take longer but never more than 3 months \nOR\nHow big is your truck to move my goods?=We can take every load size 2T, 5T, 10T to carry every load,I have few items that I want to carry local, does that change the price?=No our local prices are fixed";
                            } else if (query === "2") {
                                messageToSend = "Okay let us do this,we need just two more answers for your Virtual Assistant, please list all your services and the price for each separated by a comma in this format descr=amount and send them, all the you services listed above e.g website deveopmen=100USD, Mobile Application development=300USD \nOR \nMoving goods local(in town)=10USD,Moving goods above 2T=45USD \nOR \nPedicure=7USD,Manicure=10USD";
                            } else {
                                messageToSend = "This response is out of the expected one, Please send one of the options indicated above 1 or 2 or 3 or 4";
                            }

                        } else {
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                        }
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch(console.error);
                        break;
                    case 9:
                        if (messages[1] == "2") {
                            let faqsArray = query.split(",");
                            if (faqsArray.length < 1 || faqsArray === null) {
                                messageToSend = "It appears you did not list your frequently asked questions the right way, please follow these instructions , your clients might have questions, please help them get answers quickly, by sending frequently asked questions in the format question=answer separate each by a comma e.g Do you do house calls?=yes,how much is pedicure if I have my own nails?=To ensure quality we use only our nails which we know the source and works well together the rest of our tools \nOR \nHow secure is your website?=It is very secure and even protected from bots,How long does it take to make a mobile application on average?=It takes 3 weeks for a basic application more complex apps might take longer but never more than 3 months \nOR\nHow big is your truck to move my goods?=We can take every load size 2T, 5T, 10T to carry every load,I have few items that I want to carry local, does that change the price?=No our local prices are fixed";
                            } else {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = `These are your questions and answers\n`;
                                for (let index = 0; index < faqsArray.length; index++) {
                                    const element = faqsArray[index];
                                    messageToSend += `${index + 1} ${element.substring(0, element.indexOf("="))}  \n${element.substring(element.indexOf("=") + 1, element.length)}}\n\n`;
                                }
                                messageToSend += `Please confirm these are your questions and the answers are correct,  \n*1* Yes, it is correct \n*2* Not correct, can I retype them \nSend the number that shows the option you want e.g 1 to confirm these are correct `;
                            }
                        } else {
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                        }
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch(console.error);
                        break;
                    case 10:
                        if (messages[1] == "2") {
                            if (query === "1") {
                                messages.push(query);
                                messageChain.set(no, messages);
                                let milliSecondsSinceEpoch = new Date().valueOf().toString();

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

                                let package = clientMap.get(no)[0];


                                var worker = new Worker({
                                    name: messages[2],
                                    category: category,
                                    skills: messages[4],
                                    brief: messages[5],
                                    areas: messages[6],
                                    prices: messages[7],
                                    faqs: messages[9],
                                    package: package,
                                    expired: false,
                                    no: no,
                                    date: new Date(),
                                    id: milliSecondsSinceEpoch
                                });


                                mongoWorker.saveWorker(worker).then((v) => {
                                    let website = "";
                                    if (package === "7.99") {
                                        website = `\nThe link to your web page is https://${messages[2]}.gigz.co.zw, you can use it to market your services, to add your picture use this link https://263713020524?text=${milliSecondsSinceEpoch}@pic , this picture will make your web page look even nicer, also use links above to add pictures of the work you've done, that helps you get clients`;
                                    }
                                    messageToSend = `Account successfully saved, now we start marketing your services, \nFor anyone to use your Virtual Assistant or Chatbot they need to use this link https://263713020524?text${messages[2]}@va your name with @va added to it \nFor anyone to add recommendations for your services,(You should encorage your clients to do so because this helps you get more clients) this should use this link https://263713020524?text=${messages[2]}@rate which is your name added @rate  \nIf you ever add more services you can add your service using this link https//263713020524?text=${messages}@services \nTo add pictures of some of the work you have done use this link https://263713020524?text${messages[2]}@portfolio  ${website} \nCongratulations on getting started on Gigz, we look foward to working together,marketing your services and giving you tools to improve your operations and efficies`;
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                        messageChain.delete(no);
                                    }).catch(console.error);


                                }).catch((e) => {
                                    console.error(e);
                                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                    messageChain.delete(no);
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);

                                });
                            } else if (query === "2") {
                                messageToSend = "Okay let us do this again, One last question, your clients, might have questions, please help them get answers quickly, by sending frequently asked questions in the format question=answer separate each by a comma e.g Do you do house calls?=yes,how much is pedicure if I have my own nails?=To ensure quality we use only our nails which we know the source and works well together the rest of our tools \nOR \nHow secure is your website?=It is very secure and even protected from bots,How long does it take to make a mobile application on average?=It takes 3 weeks for a basic application more complex apps might take longer but never more than 3 months \nOR\nHow big is your truck to move my goods?=We can take every load size 2T, 5T, 10T to carry every load,I have few items that I want to carry local, does that change the price?=No our local prices are fixed";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            } else {
                                messageToSend = "Please choose one of the follow options, 1 or 2, what you sent is not within the scope of the current chat, if this is not what you want type #";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            }
                        } else {
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);
                        }
                        break;
                    default:
                        messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                        messageChain.delete(no);
                        break;
                }

            } else { // user has not communicated yet, welcome them

                messages.push("First message");
                messageChain.set(no, messages);
                var timeOfDay = "";
                if (new Date().getHours() < 12) {
                    timeOfDay = "Morning";
                } else if (new Date().getHours() > 12 && new Date().getHours() < 16) {
                    timeOfDay = "Afternoon";
                } else {
                    timeOfDay = "Day";
                }

                messageToSend = `Pleasant ${timeOfDay} ${name}, welcome to Gigz \n\n \n*1* Search for a service \n*2* Register \n*3* How does this work?   \n\nSend the number of the option you want, e.g send 2 if you want to register as a service provider`;

                client.sendMessage(msg.from, messageToSend).then((res) => {

                }).catch(console.error);

            }

        }


        // messageToSend = `${no} sent in ${query}`;
        // client.sendMessage("263772263139@c.us", messageToSend).then((res) => {
        // console.log("Res " + JSON.stringify(res));

        // }).catch(console.error);

    }
    //else {


    //     let k = no.substring(no.indexOf('-'), no.length);

    //     if (groupChain.has(k)) {

    //         if (groupChain.get(k).length > 8) {
    //             client.sendMessage(no, ads[sentMessages % 8]).then((res) => {
    //                 sentMessages++;
    //                 console.log(`Sent ${sentMessages}`);
    //                 groupChain.delete(k);
    //             }).catch(console.error);

    //         } else {
    //             let noOfM = groupChain.get(k);
    //             noOfM.push("m");
    //             groupChain.set(k, noOfM);
    //         }

    //     } else {
    //         let noOfM = [];
    //         noOfM.push("m");
    //         groupChain.set(k, noOfM);
    //         client.sendMessage(no, ads[sentMessages % 8]).then((res) => {
    //             // client.sendMessage(no, ads[sentMessages % 9]).then((res) => {
    //             sentMessages++;
    //             console.log(`Sent ${sentMessages}`);
    //         }).catch(console.error);
    //     }

    // }






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