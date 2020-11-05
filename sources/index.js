const {ApolloServer,gql, ApolloError} = require('apollo-server');
const UserAPI = require('./datasources/users.js');
const ClubAPI = require('./datasources/clubs.js');
const EventAPI = require('./datasources/events.js');
const VenueAPI = require('./datasources/venues.js');
const AccessLevelAPI = require('./datasources/accessLevels.js');
const typeDefs = require('./schema.js');
const resolvers = require('./resolvers.js');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const seed = require('./seed_database');
const admin = require('firebase-admin');
const gqltag=require('graphql-tag');
const permission=require("./models/permission");
const user = require('./models/user.js');


dotenv.config();


mongoose.connect(process.env.MONGODB_URL||"mongodb://localhost/elaichi",{ useNewUrlParser: true ,useUnifiedTopology: true });
mongoose.connection.once('open',()=>{
    console.log('connected to the database');
    // seed.seedData();
    seed.seedPermissions();
});

// Firebase Init
const firebaseInit=async ()=>{
    const serviceAccount = require("../project-dates-493f1-firebase-adminsdk-s22ew-8bf811a509.json");

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://project-dates-493f1.firebaseio.com"
    });
}


const dataSources =() => ({
    UserAPI: new UserAPI(),
    ClubAPI: new ClubAPI(),
    EventAPI: new EventAPI(),
    VenueAPI: new VenueAPI(),
    AccessLevelAPI: new AccessLevelAPI(),
});

const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources,
    introspection:true,
    playground:true,
    debug:false,
    context: async ({req})=>{
        const obj = gql`
            ${req.body.query}
        `;
        // console.log(obj.definitions[0].selectionSet.selections[0].selectionSet.selections);
        // console.log(obj.definitions[0].selectionSet.selections[0].name);
        if(req.headers && req.headers.authorization){
            const idToken=req.headers.authorization;
            try {
                const decodedToken= await admin.auth().verifyIdToken(idToken)    
                // console.log(decodedToken.roles);
                // console.log(decodedToken);
                const userPermission= await permission.findOne({role:decodedToken.roles});
                // console.log(userPermission);
                return {permissions:userPermission.permissions};
            } catch (error) { 
                // console.log(error.errorInfo);
                // const errorObj=new Error(error.errorInfo.message);
                // errorObj.errorCode="ERROR401";
                // throw errorObj;
                throw new Error(error.errorInfo.message);

            }
        }

    },
    
    formatError:(err)=>{
        // if(err.extensions.code=="INTERNAL_SERVER_ERROR"){            
        //     return new ApolloError("We are having some trouble","ERROR",{Token:"Unique Token"});
        // }
        // console.log(err.originalError);
        // return new ApolloError("error happened","yolo","123");
        return new ApolloError(err.message);
    }
});

server
    .listen(5000)
    .then(({url})=>{
       firebaseInit();
        console.log(`Graphql running on ${url}`);
    });
