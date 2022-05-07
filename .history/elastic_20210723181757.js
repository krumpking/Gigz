const { Client } = require('elasticsearch');
const elasticSearchClient = new Client({ 
  node: 'http://localhost:9200',
  // log: 'trace'
 });


 module.exports = {
    addRentalPropertyLeads: async function (id,description) {
        const res = await elasticSearchClient.create({
            index: 'rentalpropertyleads',
            id: id,
            body: {
                no: id,
                description: description,
                date: new Date(),
            }
        });
        
        return res;
    },
    addRentalPropertySearchers: async function (budget, beds){
        const res = await elasticSearchClient.create({
            index: 'propertysearchers',
            id: id,
            body: {
                no: id,
                date: new Date(),
                budget: budget,
                beds: beds,
            }
        });
        
        return res;
    },
    addUniqueVisitors: async function (id){
        const res = await elasticSearchClient.create({
            index: 'visitors',
            id: id,
            body: {
                no: id,
                date: new Date(),
            }
        });
        
        return res;
    },
    addVisitors: async function (id){

        const secondsSinceEpoch = Math.round(Date.now() / 1000);

        const res = await elasticSearchClient.create({
            index: 'visitors',
            id: secondsSinceEpoch,
            body: {
                no: id,
                date: new Date(),
            }
        });
        
        return res;
    },
    addRentalPropertySubscriptionPayments: async function (id){
        const res = await elasticSearchClient.create({
            index: 'rentalpropertypayments',
            id: id,
            body: {
                no: id,
                amount: 720,
                date: new Date(),
            }
        });
        
        return res;
    },
    addRentalPropertyReports: async function (id,details){

        const secondsSinceEpoch = Math.round(Date.now() / 1000);
        
        const res = await elasticSearchClient.create({
            index: 'rentalpropertyreports',
            id: secondsSinceEpoch,
            body: {
                no: id,
                details: details,
                date: new Date(),
            }
        });
        
        return res;
    },
    addRentalPropertyClientOnSearch: async function (id,name,whereFrom, description,suburbs,budget,beds) {
        const res = await elasticSearchClient.create({
            index: 'rentalpropertyclients',
            id: id,
            body: {
                whereFrom: whereFrom,
                description: description,
                suburbs: suburbs,
                budget:budget,
                beds: beds,
                name: name,
                
            }
        });

        return res;
    },
    updateRentalPropertyClientOnSubscribe: async function (id,suburbs, description) {
        const res = await elasticSearchClient.update({
            index: 'rentalpropertyclients',
            id: id,
            body: {
                doc: {
                    suburbs: suburbs,
                    description:description,
                    subscribed: true,
                    dateOfSubscription: new Date(),
                }
                
            }
        });
        
        return res;
    },
    getRentalPropertyClient: async function (id)  {
        var res = elasticSearchClient.search({
            index: 'rentalpropertyclients',
            body: {
                query: {
                    match: {
                        _id: id,
                    }
                }
            }
        })
        
      return res;
    
    },
    getVisitor: async function (id)  {
        var res = elasticSearchClient.search({
            index: 'visitors',
            body: {
                query: {
                    match: {
                        _id: id,
                    }
                }
            }
        })
        
      return res;
    
    },
    getAllRentalPropertyClients: async function ()  {
        const res = await elasticSearchClient.search({
            index: 'rentalpropertyclients',
            body: {
                query: {
                   match_all : {
        
                   }
                }
            }
          })
        
        return res;

    },
    getRentalProperty: async function (budget,beds,from) {
        const res = elasticSearchClient.search({
            index: 'rentalproperty',
            body: {
                from: from,
			    size:5,
                query: {
                    bool : {
                    must: [
                    {
                        range : {
                            rent : {
                                lte : budget
                            }
                        },
                    },
                    {
                        match : {
                            beds : beds
                        },
                    },
                    {
                        match : {
                            available : true,
                        },
                    }
					
                    ],
                    }
                }
        }
         });

        return res;
    },
    getRentalPropertyClientMatches: async function (clientObject,from){
        const res = elasticSearchClient.search({
            index: 'rentalproperty',
            body: {
                from: from,
			    size:7,
                query: {
                   bool : {
                     must: [
                      {
                        range : {
                            rent : {
                                lte : clientObject.budget,
                            }
                        },
                      },
                      {
                        match : {
                            beds : clientObject.beds,
                        },
                      },
                      {
                        match : {
                            available : true,
                        },
                      },
                     ],
                     should:[
                      {
                        match_phrase: {
                            description: clientObject.description,
                        }
                      },
                      {
                        match_phrase: {
                            suburb: clientObject.suburbs,
                        }
                      },
                      {
                        fuzzy: {
                            suburb: {
                              value: clientObject.suburbs
                            }
                          }
                      },
                      {
                        match_phrase: {
                            description: clientObject.whereFrom,
                        }
                      },
                     ]
                   }
                  }
            }
          });

        return res;
        
    },
    deleteRentalPropertyClient: async function (id)  {
        const res = await client.delete({
            index: "rentalpropertyclients",
            id: id,
            });
        
        return res;
    },
 

 }