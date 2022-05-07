const { Client } = require('elasticsearch');
const elasticSearchClient = new Client({ 
  node: 'http://localhost:9200',
  // log: 'trace'
 });


 module.exports = {
    getClient: async function (id)  {
        const res = await elasticSearchClient.get({
            index: 'clients',
            id: id
        });
        
        return res;

    },
    createClient: async function (id,name) {
        const res = await elasticSearchClient.create({
            index: 'clients',
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
    updateClientOnSearch: async function (id,whereFrom, budget,beds) {
        const res = await elasticSearchClient.update({
            index: 'clients',
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
    updateClientOnSubscribe: async function (id,suburbs, description,familySize) {
        const res = await elasticSearchClient.update({
            index: 'clients',
            id: id,
            body: {
                doc: {
                    suburbs: suburbs,
                    description:description,
                    familySize: familySize,
                }
            }
        });
        
        return res;
    },
    deleteClient: async function (id)  {
        const res = await client.delete({
            index: "clients",
            id: id,
            });
        
        return res;
    },
    addLeads: async function (id,description) {
        const res = await elasticSearchClient.create({
            index: 'leads',
            id: id,
            body: {
                no: id,
                description: description,
                date: new Date(),
            }
        });
        
        return res;
    },
    getHouses: async function (budget,beds) {
        const res = elasticSearchClient.search({
            index: 'houses',
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
    getClientHousesMatches: async function (clientObject){
        const res = elasticSearchClient.search({
            index: 'houses',
            body: {
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
    addSearchers: async function (budget, beds){
        const res = await elasticSearchClient.create({
            index: 'searchers',
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
    addVisitors: async function (){
        const res = await elasticSearchClient.create({
            index: 'searchers',
            id: id,
            body: {
                no: id,
                date: new Date(),
            }
        });
        
        return res;
    },
    addPayments: async function (id){
        const res = await elasticSearchClient.create({
            index: 'searchers',
            id: id,
            body: {
                no: id,
                amount: 720,
                date: new Date(),
            }
        });
        
        return res;
    },
 

 }