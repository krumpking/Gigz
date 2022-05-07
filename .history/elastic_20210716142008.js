const { Client } = require('elasticsearch');
const elasticSearchClient = new Client({ 
  node: 'http://localhost:9200',
  // log: 'trace'
 });


 module.exports = {
     getClient: getClient = (id) => {
        elasticSearchClient.get({
            index: 'clients',
            id: id
        }).then((res) => {
          console.log(res);
        });
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