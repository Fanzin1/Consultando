require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: process.env.SECRET,
    resave: "false",
    saveUninitialized: false 
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-projeto:Teste213@cluster0.isind.mongodb.net/consultandoDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

const funcionarioSchema = new mongoose.Schema({
    nome: String,
    nascimento: String,
    nacionalidade: String,
    admissao: String,
    funcao: String,
    remuneracao: Number,
    cpf: String,
    rg: String,
    periodo: String,
    atendimento: Number
});


const pacienteSchema = new mongoose.Schema({
    nome: String,
    nascimento: String,
    nacionalidade: String,
    genero: String,
    cep: String,
    rua: String,
    bairro: String,
    cidade: String,
    estado: String,
    numero: Number,
    complemento: String,
    email: String,
    telefone: String,
    cpf: String
});

const agendamentosSchema = new mongoose.Schema({
    paciente: String,
    telefone: String,
    medico: String,
    motivo: String,
    hora: String,
    data: String
})

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    empresa: String,
    funcionarios: [funcionarioSchema],
    pacientes: [pacienteSchema],
    agendamentos: [agendamentosSchema]
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
const Funcionario = new mongoose.model("Funcionario", funcionarioSchema);
const Paciente = new mongoose.model("Paciente", pacienteSchema);
const Agendamento = new mongoose.model("Agendamentos", agendamentosSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


/*********** GERAL **********/
app.get("/", function(req, res){
    res.render("index.ejs");
});

app.get("/login", function(req, res){
    res.render("login.ejs")
});

app.get("/signup", function(req, res){
    res.render("signup.ejs")
});

app.get("/home", function(req, res){
    var pass = [req.user]
    if(req.isAuthenticated()){
        res.render("home.ejs", {empresa: pass});
    }else{
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

app.post("/signup", function(req, res){

    User.register({username: req.body.username, empresa: req.body.nomeEmpresa}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/signup");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/home");
            });
        }
    });
});

app.post("/login", function(req, res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/home");
            });
        }
    });
});
/********** Funcionarios ************/

app.get("/funcionarios", function(req, res){
    if(req.isAuthenticated()){
        User.findOne({_id: req.user.id}, function(err, encontrado){
            if(err){
                console.log(err)
            }else{
                if(encontrado){
                    var verd = encontrado.funcionarios
                    res.render("funcionarios.ejs", {funcio: verd});
                }
            }
        });

    }else{
        res.redirect("/login");
    }
});

app.get("/addfunc", function(req, res){
    if(req.isAuthenticated()){
        res.render("addfunc.ejs");
    }else{
        res.redirect("/login");
    }
});

app.get("/deletar/:id", function(req, res){
    var salvar = req.params.id  
    var ret = req.user

    if(req.isAuthenticated()){
        var doc = ret.funcionarios.id(salvar).remove();
        ret.save(function(err){
            if(err){
                console.log(err)
            }else{
                res.redirect("/funcionarios");
            }
        });
    }else{
        res.redirect("/login");
    }

});

app.post("/addfunc", function(req,res){

    if(req.isAuthenticated()){
        const func = new Funcionario({
            nome: req.body.nome,
            nascimento:  req.body.nascimento,
            nacionalidade: req.body.nacionalidade,  
            admissao: req.body.admissao,
            funcao: req.body.funcao,
            remuneracao: req.body.remuneracao,
            cpf: req.body.cpf,
            rg: req.body.rg,
            periodo: req.body.periodo,
            atendimento: req.body.atendimento,
        });
    
        User.updateOne({_id: req.user.id}, {$push: {funcionarios: func}}, function(err){
            if(err){
                console.log(err)
            }else{
                res.redirect("/funcionarios")
            }
        });
    }else{
        res.redirect("/login");
    }


});

app.get("/funcionarios/:id", function(req, res){

    if(req.isAuthenticated()){
        User.findOne({_id: req.user.id}, function(err, encontrado){
            if(err){
                console.log(err);
            }
            else{
                if(encontrado){
                    const verd = encontrado.funcionarios;
                    for(var i = 0; i < verd.length; i++){
                        if(verd[i].id === req.params.id){
                            const enviar = [verd[i]]
                            res.render("editar.ejs", {funcio: enviar})
                        }
                    }
                }
            }
        });
    }else{
        res.redirect("/login");
    }

});

app.post("/editar", function(req, res){
    const idRec = req.body.idMudar;

    if(req.isAuthenticated()){
        User.updateOne({"funcionarios._id": idRec}, {
            "funcionarios.$.nome": req.body.nome,
            "funcionarios.$.nascimento":  req.body.nascimento,
            "funcionarios.$.nacionalidade": req.body.nacionalidade,  
            "funcionarios.$.admissao": req.body.admissao,
            "funcionarios.$.funcao": req.body.funcao,
            "funcionarios.$.remuneracao": req.body.remuneracao,
            "funcionarios.$.cpf": req.body.cpf,
            "funcionarios.$.rg": req.body.rg,
            "funcionarios.$.periodo": req.body.periodo,
            "funcionarios.$.atendimento": req.body.atendimento
        }, function(err){
            if(err){
                console.log(err)
            }
            else{
                res.redirect("/funcionarios");
            }
        });
    }else{
        res.redirect("/login");
    }

});

/********* Pacientes ***********/ 

app.get("/pacientes/deletar/:id", function(req, res){
    if(req.isAuthenticated()){
        var salvar = req.params.id;
        var ret = req.user;
        var doc = ret.pacientes.id(salvar).remove();
        ret.save(function(err){
            if(err){
                console.log(err)
            }else{
                res.redirect("/pacientes");
            }
        }); 
    }else{
        res.redirect("/login");
    }

});

app.get("/pacientes", function(req, res){
    if(req.isAuthenticated()){
        User.findOne({_id: req.user.id}, function(err, encontrado){
            if(err){
                console.log(err)
            }else{
                if(encontrado){
                    var verd = encontrado.pacientes
                    res.render("pacientes.ejs", {pacientes: verd});
                }
            }
        });

    }else{
        res.redirect("/login");
    }
});

app.get("/addpac", function(req, res){
    if(req.isAuthenticated()){
        res.render("addpac.ejs");
    }else{
        res.redirect("/login");
    }
});


app.post("/addpac", function(req, res){
    if(req.isAuthenticated()){
        const pac = new Paciente({
            nome: req.body.nome,
            nascimento: req.body.nascimento,
            nacionalidade: req.body.nacionalidade,
            genero: req.body.genero,
            cep: req.body.cep,
            rua: req.body.rua,
            bairro: req.body.bairro,
            cidade: req.body.cidade,
            estado: req.body.uf,
            numero: req.body.numero,
            complemento: req.body.complemento,
            email: req.body.email,
            telefone: req.body.telefone,
            cpf: req.body.cpf
        });
    
        User.updateOne({_id: req.user.id}, {$push: {pacientes: pac}}, function(err){
            if(err){
                console.log(err)
            }else{
                res.redirect("/pacientes");
            }
        });
    }else{
        res.redirect("/login");
    }
    

});

app.get("/pacientes/:id", function(req, res){
    if(req.isAuthenticated()){
        User.findOne({_id: req.user.id}, function(err, encontrado){
            if(err){
                console.log(err);
            }
            else{
                if(encontrado){
                    const verd = encontrado.pacientes;
                    for(var i = 0; i < verd.length; i++){
                        if(verd[i].id === req.params.id){
                            const enviar = [verd[i]]
                            res.render("editarpac.ejs", {pacientes: enviar});
                        }
                    }
                }
            }
        });
    }else{
        res.redirect("/login");
    }

});

app.post("/editarpac", function(req, res){

    if(req.isAuthenticated()){
        const idRec = req.body.idMudar;

        User.updateOne({"pacientes._id": idRec}, {
            "pacientes.$.nome": req.body.nome,
            "pacientes.$.nascimento": req.body.nascimento,
            "pacientes.$.nacionalidade": req.body.nacionalidade,
            "pacientes.$.genero": req.body.genero,
            "pacientes.$.cep": req.body.cep,
            "pacientes.$.rua": req.body.rua,
            "pacientes.$.bairro": req.body.bairro,
            "pacientes.$.cidade": req.body.cidade,
            "pacientes.$.estado": req.body.uf,
            "pacientes.$.numero": req.body.numero,
            "pacientes.$.complemento": req.body.complemento,
            "pacientes.$.email": req.body.email,
            "pacientes.$.telefone": req.body.telefone,
            "pacientes.$.cpf": req.body.cpf
    
        }, function(err){
            if(err){
                console.log(err)
            }
            else{
                res.redirect("/pacientes");
            }
        });
    }else{
        res.redirect("/login");
    }

})

/********* Agendamentos ***********/ 
app.get("/agendamentos/deletar/:id", function(req, res){
    if(req.isAuthenticated()){
        var salvar = req.params.id;
        var ret = req.user;
        var doc = ret.agendamentos.id(salvar).remove();
        ret.save(function(err){
            if(err){
                console.log(err)
            }else{
                res.redirect("/agendamentos");
            }
        }); 
    }else{
        res.redirect("/login");
    }

});

app.get("/agendamentos", function(req, res){
    if(req.isAuthenticated()){
        User.findOne({_id: req.user.id}, function(err, encontrado){
            if(err){
                console.log(err)
            }else{
                if(encontrado){
                    var verd = encontrado.agendamentos
                    res.render("agendamentos.ejs", {agendamentos: verd});
                }
            }
        });

    }else{
        res.redirect("/login");
    }
});

app.get("/agendamentos/:id", function(req, res){

    if(req.isAuthenticated()){
        User.findOne({_id: req.user.id}, function(err, encontrado){
            if(err){
                console.log(err);
            }
            else{
                if(encontrado){
                    const verd = encontrado.agendamentos;
                    const paci = encontrado.pacientes;
                    const func = encontrado.funcionarios
                    for(var i = 0; i < verd.length; i++){
                        if(verd[i].id === req.params.id){
                            const enviar = [verd[i]]
                            res.render("editaragen.ejs", {agendamentos: enviar, funcionarios: func, pacientes: paci})
                        }
                    }
                }
            }
        });
    }else{
        res.redirect("/login");
    }

})

app.get("/addagen", function(req, res){
    if(req.isAuthenticated()){
        User.findOne({_id: req.user.id}, function(err, encontrado){
            if(err){
                console.log(err);
           }else{
               if(encontrado){
                   const func = encontrado.funcionarios;
                   const paci = encontrado.pacientes;

                   res.render("addagen.ejs", {funcionarios: func, pacientes: paci})
               }
           }
        })
    }else{
        res.redirect("/login");
    }
});

app.post("/editaragen", function(req, res){
    if(req.isAuthenticated()){
        const idRec = req.body.idMudar;

        User.updateOne({"agendamentos._id": idRec}, {
            "agendamentos.$.paciente": req.body.paciente,
            "agendamentos.$.telefone": req.body.telefone,
            "agendamentos.$.medico": req.body.medico,
            "agendamentos.$.motivo": req.body.motivo,
            "agendamentos.$.hora": req.body.hora,
            "agendamentos.$.data": req.body.data
        }, function(err){
            if(err){
                console.log(err)
            }
            else{
                res.redirect("/agendamentos");
            }
        });
    }else{
        res.redirect("/login");
    }

})

app.post("/addagen", function(req, res){   
    if(req.isAuthenticated()){
        const agen = new Agendamento({
            paciente: req.body.paciente,
            telefone: req.body.telefone,
            medico: req.body.medico,
            motivo: req.body.motivo,
            hora: req.body.hora,
            data: req.body.data
        });
    
        User.updateOne({_id: req.user.id}, {$push: {agendamentos: agen}}, function(err){
            if(err){
                console.log(err);
            }else{
                res.redirect("/agendamentos")
            }
        }); 
    }else{
        res.redirect("/login");
    }

});

let port = process.env.PORT;
if (port == null || port == ""){
    port = 3000;
}

app.listen(port, function(){
    console.log("Servidor ligado");
});