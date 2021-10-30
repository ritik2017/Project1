const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoDBSession = require('connect-mongodb-session')(session);
const bcrypt = require('bcrypt');
const validator = require('validator');

const UserModel = require('./Model/User');
const TodoModel = require('./Model/Todo'); 

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));

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

const accesses = {};

const isAuth = (req, res, next) => {
    if(req.session.isAuth) {
        next();
    }
    else {
        return res.redirect('/login');
    }
}

const rateLimiting = (req, res, next) => {

    console.log(accesses);
    const sessionId = req.session.id;

    if(!sessionId) {
        res.send({
            status: 400,
            message: "Missing Session"
        })
    }

    if(sessionId in accesses) { // O(1)
        const previousAccessTime = accesses[sessionId];

        if(Date.now() - previousAccessTime < 300) {
            console.log(accesses, Date.now());
            res.send({
                status: 404,
                message: "Max req limit reached"
            });
            return;
        }
    }

    accesses[sessionId] = Date.now();

    next();
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
    const { loginId, password } = req.body;

    let user;

    if(validator.isEmail(loginId)) {
        user = await UserModel.findOne({email: loginId});  // database -> search -> return
    }
    else {
        user = await UserModel.findOne({username: loginId});
    }

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

const cleanAndValidate = ({name, email, password, username}) => {

    return new Promise(async (resolve, reject) => {
        if(typeof(email) != "string") email = "";
        if(typeof(password) != "string") password = ""; 

        if(!email || !password) 
            reject("Invalid Data Provided");

        if(!validator.isEmail(email)) 
            reject("Invalid Email");

        if(password.length > 0 && password.length < 6) // 6 character, small, capital, symbol, number
            reject("Password too short");

        if(username.length < 3)
            reject("Username is too short")

        let user;
        
        user = await UserModel.findOne({email});

        if(user)
            reject("User already exists");

        user = await UserModel.findOne({username});
        
        if(user)
            reject("Username is already taken");

        resolve();
    });  

}

app.post('/register', async (req, res) => {
    const { name, email, password, username } = req.body;
    try {
        await cleanAndValidate(req.body);
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
        username,
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

app.get('/dashboard', rateLimiting, isAuth, async (req, res) => {

    console.log(req.session.id);

    try {
        let todos = await TodoModel.find();

        res.render('dashboard', {todos: todos});
    }
    catch(err) {
        res.send({
            status: 400,
            message: "An internal error occured",
            error: err
        });
    }
});

app.get('/home', rateLimiting, isAuth, (req, res) => {
    res.render('home');
});

app.post('/pagination_dashboard', rateLimiting, isAuth, async (req, res) => {

    let skip = req.query.skip || 0;

    try {

        let todos = await TodoModel.aggregate([
            { $facet: {
                data: [ {"$skip": parseInt(skip)}, {"$limit": 4} ]
            } }
        ]);

        console.log(todos);

        res.send({
            status: 200,
            message: "Request Successful",
            value: todos
        });

    }
    catch(err) {
        res.send({
            status: 400,
            message: "An internal error occured",
            error: err
        });
    }
})

app.post('/create-item', rateLimiting, isAuth, async (req, res) => {
    
    let todo = new TodoModel({
        todo: req.body.itemName
    });

    try {
        let result = await todo.save();

        res.send({
            status: 200,
            message: "Todo Saved Successfully",
            data: result
        });
    }
    catch(err) {
        res.send({
            status: 400,
            message: "An error has occured",
            error: err
        });
    }
});

app.patch('/edit-item', rateLimiting, isAuth, async (req, res) => {

    try {
        let result = await TodoModel.findOneAndUpdate({_id: req.body._id}, {todo: req.body.message});

        res.send({
            status: 200,
            message: "Data updated Successfully",
            data: result
        });
    }
    catch(err) {
        res.send({
            status: 400,
            message: "An error occured cannot update item",
            error: err
        });
    }
});

app.post('/delete-item', rateLimiting, isAuth, async (req, res) => {
    try {
        let result = await TodoModel.deleteOne({_id: req.body._id});

        res.send({
            status: 200,
            message: "Data deleted Successfully",
            data: result
        });
    }
    catch(err) {
        res.send({
            status: 400,
            message: "An error occured cannot update item",
            error: err
        });
    }
});

// // userid: "time"

// app.get('/index/:userid', (req, res) => {
//     const {userid} = req.params;

//     if(!userid) {
//         res.send({
//             status: 400,
//             message: "Missing userid"
//         })
//     }

//     if(userid in accesses) { // O(1)
//         const previousAccessTime = accesses[userid];

//         if(Date.now() - previousAccessTime < 100) {
//             console.log(accesses, Date.now());
//             res.send({
//                 status: 404,
//                 message: "Max req limit reached"
//             });
//             return;
//         }
//     }

//     // Database op
//     // Logic 

//     accesses[userid] = Date.now();

//     res.send({
//         status: 200,
//         message: "Welcome to index page"
//     });
// })

app.listen( process.env.PORT || PORT, () => {
    console.log(`Listening on port ${PORT}`);
});


// deleteOne, insertOne, find, findOne, findOneandUpdate, 


// Select p.id, p.name, p.age, c.dob, c.card_no, a.acc_no, a.acc_type from Personal_deatils p INNER JOIN
// Card_deatils c INNER JOIN Account_details a where p.id = c.id AND p.id = a.id;

// Select p.id, p.name, p.age, c.dob, c.card_no from Personal_deatils p LEFT JOIN
// Card_deatils c where p.id = c.id;

// Select p.id, p.name, p.age, c.dob, c.card_no from Personal_deatils p RIGHT JOIN
// Card_deatils c where p.id = c.id;

// Select p.id, p.name, p.age, c.dob, c.card_no from Personal_deatils p OUTER JOIN
// Card_deatils c where p.id = c.id;


// Select p.id, p.name, p.age, c.dob, c.card_no, a.acc_no, a.acc_type from Personal_deatils p LEFT JOIN
// Card_deatils c INNER JOIN Account_details a where p.id = c.id AND p.id = a.id;


// Select * from todos Limit 4 OFFSET 0