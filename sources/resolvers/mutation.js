const User= require('./user.js');
const Event= require('./event.js');
const Club= require('./club.js');
const Venue= require('./venue.js');

const mutations={};

const schemas= [User,Event,Club];

schemas.forEach((s)=>{
    Object.assign( mutations, s.mutations );
});

module.exports = mutations