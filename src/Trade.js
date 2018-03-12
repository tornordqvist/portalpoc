export class Trade {
    constructor(id, timestamp, type, instrument, quantity, price, amount) {
        this.id = id;
        this.timestamp = timestamp;
        this.type = type;
        this.instrument = instrument;
        this.quantity = quantity;
        this.price = price;
        this.amount = amount;
    }
    static copy(c) {
        return new Trade(c.id, c.timestamp, c.type, c.instrument, 
            c.quantity, c.price, c.amount);
    }
    get clone() {
        return new Trade(this.id, this.timestamp, this.type, this.instrument, 
            this.quantity, this.price, this.amount);
    }
    static generateNewId() {
        var s = (new Date().getTime()).toFixed(0);
        return s.substring(0,s.length-3) + (1e4 + Math.floor(Math.random() * 9e4)).toFixed(0);
    }        
    static createRandom() {
        var rand = (n) => {
            if (Array.isArray(n))
                return n[rand(n.length)];
            return Math.floor(n*Math.random());
        }
        var randomInstrs = ["ABC","DEF","GIH","JKL","MNO","PQR","STU","VXY"];
        var factors = [1,1.5,2,3,5,7.5];
        var price = (10 + rand(99000))/100;
        var quantity = rand(factors) * Math.pow(10, 1+rand(3));
        return new Trade(Trade.generateNewId(), new Date(),
            rand(2)===0 ? "Buy":"Sell", rand(randomInstrs), 
            quantity, price, quantity*price);        
    }
}

