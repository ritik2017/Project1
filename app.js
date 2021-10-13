const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoDBSession = require('connect-mongodb-session')(session);
const bcrypt = require('bcrypt');
const validator = require('validator');

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

const isAuth = (req, res, next) => {
    if(req.session.isAuth) {
        next();
    }
    else {
        return res.redirect('/login');
    }
}

app.get('/', (req, res) => {
    res.send("Welcome to our app");
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    let user = await UserModel.findOne({email});  // database -> search -> return

    if(!user) {
        return res.send("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch) {
        return res.send("Invalid Password");
    }

    req.session.isAuth = true;
    console.log(req.session);
    console.log(req.session.id);

    res.redirect('/dashboard');
    return;
});

const cleanAndValidate = ({name, email, password}) => {

    return new Promise(async (resolve, reject) => {
        if(typeof(email) != "string") email = "";
        if(typeof(password) != "string") password = ""; 

        if(!email || !password) 
            reject("Invalid Data Provided");

        if(!validator.isEmail(email)) 
            reject("Invalid Email");

        if(password.length > 0 && password.length < 6) // 6 character, small, capital, symbol, number
             reject("Password too short");

        let user = await UserModel.findOne({email});

        if(user)
            reject("User already exists");

        resolve();
    });  

}

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        await cleanAndValidate(req.body);
        await find();
        await game();
    }
    catch(err) {
        console.log(err);
        res.send(err);
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 13); 

    user = new UserModel({
        name,
        email,
        password: hashedPassword
    });

    user.save();

    res.redirect('/login');
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if(err) throw err;

        res.redirect('/');
    });
})

app.get('/dashboard', isAuth, (req, res) => {
    res.render('dashboard');
});

app.get('/home', isAuth, (req, res) => {
    res.send('Welcome to home page');
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});


// Route, Middleware