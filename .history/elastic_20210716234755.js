const { Client } = require('elasticsearch');
const elasticSearchClient = new Client({ 
  node: 'http://localhost:9200',
  // log: 'trace'
 });


 module.exports = {
    getHouseClient: async function (id)  {
        var res = elasticSearchClient.search({
            index: 'houseClients',
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
    getAllHouseClients: async function ()  {
        const res = await elasticSearchClient.search({
            index: 'houseClients',
            body: {
                query: {
                   match_all : {
        
                   }
                }
            }
          })
        
        return res;

    },
    addHouseClient: async function (id,name) {
        const res = await elasticSearchClient.create({
            index: 'houseClients',
            id: id,
            body: {
                name: name,
                no: id,
                date: new Date(),
                subscribed: false,
            }
        });
        
        return res;

    },
    updateHouseClientOnSearch: async function (id,whereFrom, budget,beds) {
        const res = await elasticSearchClient.update({
            index: 'houseClients',
            id: id,
            body: {
                doc: {
                    whereFrom: whereFrom,
                    budget:budget,
                    beds: beds,
                    subscribed: false,
                }
            }
        });

        return res;
    },
    updateHouseClientOnSubscribe: async function (id,suburbs, description) {
        const res = await elasticSearchClient.update({
            index: 'houseClients',
            id: id,
            body: {
                doc: {
                    suburbs: suburbs,
                    description:description
                }
            }
        });
        
        return res;
    },
    deleteHouseClient: async function (id)  {
        const res = await client.delete({
            index: "houseClients",
            id: id,
            });
        
        return res;
    },
    addHouseLeads: async function (id,description) {
        const res = await elasticSearchClient.create({
            index: 'houseLeads',
            id: id,
            body: {
                no: id,
                description: description,
                date: new Date(),
            }
        });
        
        return res;
    },
    getProperties: async function (budget,beds) {
        const res = elasticSearchClient.search({
            index: 'Properties',
            body: {
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
                    ],
                    }
                }
        }
         });

        return res;
    },
    getPropertiesClientMatches: async function (clientObject,from){
        const res = elasticSearchClient.search({
            index: 'Properties',
            body: {
                from: from,
			    size:5,
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
    addPropertiesearchers: async function (budget, beds){
        const res = await elasticSearchClient.create({
            index: 'propertySearchers',
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
    addVisitors: async function (id){
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
    addRentalPropertySubscriptionPayments: async function (id){
        const res = await elasticSearchClient.create({
            index: 'housePayments',
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
        const res = await elasticSearchClient.create({
            index: 'houseReports',
            id: id,
            body: {
                no: id,
                details: details,
                date: new Date(),
            }
        });
        
        return res;
    },
 

 }