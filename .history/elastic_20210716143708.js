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
    createClient: createClient = () => {
         
    },
    updateClient: updateClient = () => {
         
    },
    deleteClient: deleteClient = () => {
         
    },
    getHouses: getHouses = () => {
         
    },

 }