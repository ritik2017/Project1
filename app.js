const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoDBSession = require('connect-mongodb-session')(session);

const UserModel = require('./Model/User');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const mongoURI = `mongodb+srv://myappuser:ritikkumar@cluster0.mjfcg.mongodb.net/octoberSessions?retryWrites=true&w=majority`;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then((res) => {
    //console.log(res);
    console.log("Mongo Connected");
});

const store = new MongoDBSession({
    uri: mongoURI,
    collection: 'mySessions'
});

app.set('view engine', 'ejs');

app.use(session({
    secret: "Our secret key",
    resave: false,
    saveUninitialized: false,
    store: store
}));

app.get('/', (req, res) => {
    req.session.isAuth = true;
    console.log(req.session);
    console.log(req.session.id);

    res.send("Welcome to our app");
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/login', (req, res) => {

});

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    let user = await UserModel.findOne({email});

    if(user) {
        res.send("User already exists");
        return;
    }

    user = new UserModel({
        name,
        email,
        password
    });

    user.save();

    res.send('Registration successfull');
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});