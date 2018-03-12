import ReactDOM from 'react-dom';
import './index.css';
import { App } from './App';
import { TradeModel } from './TradeModel';
import registerServiceWorker from './registerServiceWorker';

import React from 'react';
import { BrowserRouter as Router } from "react-router-dom";
import { applyMiddleware, createStore, combineReducers } from 'redux';
//import logger from 'redux-logger'
import promise from 'redux-promise-middleware';
import { Provider } from 'react-redux'

const positionsReducer = (state=[], action) => {
    if (action.type === "POSITIONS_SET")
        return action.payload;
    return state.map(d=> ({...d}));
};

Array.prototype.toDictionary = function (keyfun) {
    return this.reduce((p, c) => { p[keyfun(c)] = c; return p; }, {});
}

const tradesReducer = (state=[], action) => {
    state = state.map( d => d.clone );
    switch (action.type) {
        case "TRADE_PUT": 
        case "TRADE_FETCH_FULFILLED": {
            var t = action.payload.clone;
            var i = state.findIndex(d=> d.id === t.id);
            if (i<0)
                state.push(action.payload.clone);
            else
                state[i] = t;
            break;
        }
        default:
            break;
    }
    return state;
};

const aggregatePositions = (store) => (next) => (action) => {
    next(action);
    switch (action.type) {
        case "TRADE_PUT": 
        case "TRADE_FETCH_FULFILLED": {
            var state = store.getState();
            var posdict = state.trades.reduce((p,c)=>{
                var q = p[c.instrument];
                if (q === undefined)
                    q = 0;
                if (c.type !== "Insert")
                    q += c.quantity * ((c.type === "Buy")?1:-1);
                p["CASH"] += c.amount * ((c.type === "Buy")?-1:1);
                p[c.instrument] = q;
                return p;
            }, { "CASH": 0 });
            var positions = Object.keys(posdict).map(d => ({ instrument: d, quantity: posdict[d] }));
            //console.log(positions);
            store.dispatch({ type: "POSITIONS_SET", payload: positions });
            break;
        }
        default:
            break;
    }
}

const store = createStore(
    combineReducers({ trades: tradesReducer, positions: positionsReducer }),
    applyMiddleware(aggregatePositions, promise()/*, logger*/)
);

store.subscribe(()=>{
    ReactDOM.render(<Provider store={store} ><Router><App /></Router></Provider>, document.getElementById('root'));    
})

store.dispatch({
    type: "TRADE_PUT", 
    payload: TradeModel.createRandom()
});

setInterval(()=> { 
store.dispatch({
    type: "TRADE_FETCH", 
    payload: new Promise(function(resolve) { setTimeout(resolve, 100); })
    .then(()=>TradeModel.createRandom())
});
}, 3000);

registerServiceWorker();
