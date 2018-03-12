import './App.css';
import React from 'react';
import { Route, Link, Redirect } from "react-router-dom";
import PropTypes from 'prop-types';
import querystring from 'querystring';
import { Trade } from './Trade';

class Home extends React.Component {
  render() {
    var trades = this.context.store.getState().trades;
    return <div><h2>Welcome!</h2>
      <p>Number of trades: <Link to="/trades">{trades.length}</Link></p>
      <div>Last trade: {(trades.length>0)? <TradeItem value={trades[trades.length-1]}/>:null}</div>
      </div>;
  }
}  
Home.contextTypes = { store: PropTypes.object };

class FormRadio extends React.Component {
  render() {
    var { id, label, value, enabled, checked } = this.props;
    if (enabled === undefined)
      enabled = true;
    if (!checked)
      checked = false;
    return <div className="form-check">
      <input className="form-check-input" type="radio" name="type" id={id} value={value} defaultChecked={checked} disabled={!enabled} />
      <label className="form-check-label" htmlFor={id}>{value}</label>
      </div>;
  }
}

class FormRadioGroup extends React.Component {
  render() {
    var { id, label, value, enabled, values } = this.props;
    if (!id)
      id = label.toLowerCase();
    if (enabled === undefined)
      enabled = true;
    return <fieldset className="form-group">
      <div className="row">
        <legend className="col-form-label col-3 pt-0">Type</legend>
        <div className="col-9">
          {values.map((d,i)=><FormRadio key={i} id={id+i} value={d} checked={value===d} enabled={enabled}/>)}
        </div>
      </div>
      </fieldset>;
  }
}

class FormText extends React.Component {
  render() {
    var { id, label, value, enabled } = this.props;
    if (!id)
      id = label.toLowerCase();
    if (enabled === undefined)
      enabled = true;
    return <div className="form-group row">
      <label htmlFor={id} className="col-3 col-form-label">{label}</label>
      <div className="col-9">
        <input type="text" className="form-control" id={id} placeholder={label} defaultValue={value} disabled={!enabled} />
      </div>
    </div>;
  }
}  

class FormSelect extends React.Component {
  render() {
    var { id, label, value, values, enabled } = this.props;
    if (!id)
      id = label.toLowerCase();
    if (enabled === undefined)
      enabled = true;
    return <div class="form-group row">
      <label htmlFor={id} className="col-3 col-form-label">{label}</label>
      <div className="col-9">
        <select class="form-control" id={id} disabled={!enabled}>
        {values.map((d,i)=><option key={i} id={id+i} selected={value===d}>{d}</option>)}
        </select>
      </div>
    </div>;
  }
}  

class FormButton extends React.Component {
  render() {
    var value = this.props.value;
    return <div className="form-group row">
      <div className="col-3">
        <button type="submit" className="btn btn-primary">{value}</button>
      </div>
    </div>;
  }
}  

class EditTrade extends React.Component {
  constructor(props) {
    super(props);
    this.state = null;
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  handleSubmit(event) {
    console.log("submit");
    var trade = Trade.copy(this.state);
    trade.instrument = this.node.querySelector("#instrument").value;
    trade.price = Number(this.node.querySelector("#price").value);
    trade.quantity = Number(this.node.querySelector("#quantity").value);
    trade.type = ["Buy","Sell"].find((d,i)=>this.node.querySelector("#type"+i).checked);
    if (trade.instrument && !Number.isNaN(trade.price) && !Number.isNaN(trade.quantity)) {
      this.amount = this.quantity * this.price;
      this.context.store.dispatch({
        type: "TRADE_PUT", 
        payload: trade
      });
      this.setState({id:null});
    }
    event.preventDefault();
  }
  componentWillMount() {
    var id = this.props.match.params.id;
    var trade;
    if (id === "new") {
      trade = new Trade(Trade.generateNewId(), new Date(), "Buy", "", 0, 0, 0);
    }
    else {
      var trades = this.context.store.getState().trades;
      trade = trades.find(d=>d.id===id);
      if (trade)
        trade = trade.clone;
    }
    this.setState((prevState, props) => trade ? trade.clone : null);    
  }
  render() {
    var trade = this.state;
    if (!trade || !trade.id)
      return <Redirect to="/trades" />; //<div className="row"><div className="col-12">No trade matching {this.props.match.params.id}</div></div>;
    return <form onSubmit={this.handleSubmit} ref={node => this.node = node}>
      <h2>Edit trade</h2>
      <FormText id="id" label="ID" value={trade.id} enabled={false} />
      <FormText id="instrument" label="Instrument" value={trade.instrument} />
      <FormRadioGroup id="type" label="Type" values={["Buy","Sell"]} value={trade.type} />
      <FormText id="price" label="Price" value={trade.price} />
      <FormText id="quantity" label="Quantity" value={trade.quantity} />
      <FormButton value="Save" />
    </form>;
  }
}  
EditTrade.contextTypes = { store: PropTypes.object };

class TradeItem extends React.Component {
  render() {
      var trade = this.props.value;
      return <div>
      <Link to={"/trade/"+trade.id}>{trade.type + " " + trade.quantity + " "}</Link>
      <Link to={"/trades/?instrument="+trade.instrument}>{trade.instrument}</Link>
      <Link to={"/trade/"+trade.id}>{" @ " + trade.price}</Link>
      </div>;
  }
}

class Trades extends React.Component {
  render() {
    var id = this.props.match.params.id;
    var instrument = null;
    if (this.props.location.search) {
      var queryparams = querystring.parse(this.props.location.search.substring(1));
      instrument = queryparams.instrument;
    }
    //console.log("id="+id+",instrument="+instrument)
    var checkId = (d,id) => !id || (d.id === id);
    var checkInstrument = (d,instrument) => !instrument || (d.instrument === instrument);
    var trades = this.context.store.getState().trades;
    if (!trades)
      trades = [];

    var instrs = Object.keys(trades.reduce((p,c)=>{
      p[c.instrument] = true;
      return p;
    },{})).sort();
    if (id || instrument) {
      //console.log(trades.map(d=>"checkId="+d.id+","+checkId(d,id)+", checkInstrument="+checkInstrument(d,instrument)).join("\n"));
      trades = trades.filter(d=>checkId(d,id) && checkInstrument(d,instrument));
    }

    var button = (i,q,n) => <Link key={i} to={"/trades/"+q}>
    <button type="button" className={"btn btn-primary"+(((instrument===n)||((!instrument)&&(n==="ALL")))?" active":"")}>{n}</button>
    </Link>;

    return <div className="trades"><h2>Trades</h2>
        <div className="tradesbuttons">
          { instrs.map((d,i) => button(i,(d==="CASH")?"":"?instrument="+d,d)) }
          { button(instrs.length,"","ALL") }
        </div>
        <ul>
          { trades.map((d,i) => <li key={i}><TradeItem value={d} /></li>) }
        </ul>
    </div>;
  }
}
Trades.contextTypes = { store: PropTypes.object };

class Positions extends React.Component {
  render() {
      var positions = this.context.store.getState().positions;
      if (!positions)
          positions = [];
      return <div className="positions">
          <h2>Positions</h2>
          <ul className="col-6">
              { positions.map((d,i) => <li key={i}>
              <div className="col-3"><Link key={i} to={"/trades/"+((d.instrument==="CASH")?"":"?instrument="+d.instrument)}>{d.instrument}</Link></div>
              <div className="col-3">{d.quantity.toFixed(0)}</div></li>) }
          </ul>
      </div>;
  }
}  
Positions.contextTypes = { store: PropTypes.object };

/*
class Hello extends React.Component {
  render() {
    var trades = this.context.store.getState().trades;
    return <div className="hello">{"Hello "+trades.length+"!"}</div>;
  }
}
Hello.contextTypes = { store: PropTypes.object };
connect(state=>{
  console.log("connect state");
  return {trades: state.trades};
},dispatch=>{
  console.log("connect dispatch");
  return {};
})(Hello);
*/

export class App extends React.Component {
  render() {
    return (
      <div>
        <nav className="navbar navbar-expand navbar-dark">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item">
              <Link to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link to="/trades">Trades</Link>
            </li>
            <li className="nav-item">
              <Link to="/positions">Positions</Link>
            </li>
            <li className="nav-item">
              <Link to="/trade/new">Book new trade</Link>
            </li>
          </ul>
        </nav>
        <div className="container">
          <hr />
          <Route exact path="/" component={Home} />
          <Route path="/trades" component={Trades} />
          <Route path="/trade/:id" component={EditTrade} />
          <Route path="/positions" component={Positions} />
        </div>
      </div>
    );
  }
}

