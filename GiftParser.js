var question = require('./lib/question');
var questionnaire = require('./lib/questionnaire');
var profil = require('./lib/profil');
const { array } = require('vega');

var GiftParser = function(sTokenize, sParsedSymb){
// La liste récupéré des objets questions, récupérer par le parser
	this.parsedQuestion = []; 
	this.showTokenize = sTokenize;
	this.showParsedSymbols = sParsedSymb;
	this.errorCount = 0;
}

// tokenize : tranform the data input into a list
// On pense donc à tokenise par CRLF
// et on enlève les commentaires : les lignes qui commencent par '//', ou par "$"
// Enfin, on enlève les données du tableau qui sont vides
/*
GiftParser.prototype.tokenize = function(data){
	// Pour MacOS
	var separator = /(\n\n)/; 
	// Pour Windows
	// var separator = /(\r\n)/; 
	data = data.split(separator);
	data = data.filter((val, idx) => !val.match(separator)); 
	data = data.filter((val, idx) => !val.startsWith('//'));
	data = data.filter((val, idx) => !val.startsWith('$'));
	data = data.filter((val, idx) => val !== ''); // Remove de tout les commentaires du fichier
	return data;
	return data
        .split(separator) // Divise le texte en blocs
        .map(line => line.trim()) // Supprime les espaces inutiles
        .filter(line => line !== "") // Supprime les lignes vides
        .filter(line => !line.startsWith("//")) // Ignore les commentaires
        .filter(line => !line.startsWith("$")) // Ignore les lignes commençant par "$"
		.map(line => line.replace(/<[^>]*>/g, "")) // supprime les balises html
		.map(line => line.replace(/\[html\]/gi, ""));  // supprime les [html]
}
*/

GiftParser.prototype.tokenize = function(data) {
    return data
        .split(/\r?\n/) // Divise le texte ligne par ligne (compatible Windows/MacOS/Linux)
        .map(line => line.trim()) // Supprime les espaces inutiles
        .filter(line => line !== "") // Supprime les lignes vides
        .filter(line => !line.startsWith("//")) // Ignore les commentaires
		.filter(line => !line.startsWith("$"))
        .map(line => line.replace(/<[^>]*>/g, "")) // Supprime les balises HTML
        .map(line => line.replace(/\[html\]/gi, ""));  // Supprime les [html]
};


// parse : analyze data by calling the first non terminal rule of the grammar
GiftParser.prototype.parse = function(data){
	var tData = this.tokenize(data);
	if(this.showTokenize){
		console.log(tData);
	}
	questionnaireParsed = this.questionnaire(tData);
	return questionnaireParsed;
}

// errMsg : Parser operand error message

GiftParser.prototype.errMsg = function(msg, input){
	this.errorCount++;
	console.log("Parsing Error ! on "+input+" -- msg : "+msg);
}

// next : Read and return a symbol from input
GiftParser.prototype.next = function(input){
	var curS = input.shift();
	if(this.showParsedSymbols){
		console.log(curS);
	}
	return curS
}

/* Pas utile (pottentiellement à supprimer)
// accept : verify if the arg s is part of the language symbols.
GiftParser.prototype.accept = function(s){
	var idx = this.symb.indexOf(s);
	// index 0 exists
	if(idx === -1){
		this.errMsg("symbol "+s+" unknown", [" "]);
		return false;
	}

	return idx;
}

// check : check whether the arg elt is on the head of the list
GiftParser.prototype.check = function(s, input){
	if(this.accept(input[0]) == this.accept(s)){
		return true;	
	}
	return false;
}

 */

// expect : expect the next symbol to be s.
GiftParser.prototype.expect = function(s, input){
	if(s == this.next(input)){
		//console.log("Reckognized! "+s)
		return true;
	}else{
		this.errMsg("symbol "+s+" doesn't match", input);
	}
	return false;
}

// Parser rules

// gift-file  =  1*((commentary / question) CRLF)
GiftParser.prototype.questionnaire = function(input){
	this.question(input);
	return new questionnaire(this.parsedQuestion);
}

// question = créer une liste de question et les met dans le parsedQuestion en fonction de l'input (qui respecte l'ABNF)
/* Ancienne question
GiftParser.prototype.question = function(input) {
    if (!input || input.length === 0 || !input[0]) {
        console.error("Erreur : Input vide ou ligne invalide détectée.");
        return false;
    }

    if (matched = input[0].match(/::\s*(.*?)\s*::\s*(.*)?/)) {
        const args = this.body(input); // Récupère les données parsées

        // Crée l'objet question avant l'extraction des réponses et des commentaires
        var p = new question(args.tit, args.sent, "MC", [], []);

        // Passe l'objet `p` pour mettre à jour directement son champ `commentaire`
        args.cor = args.sent
            .map(sentence => this.extractCorrectAnswers(sentence, p))
            .flat();

        // Assignez les réponses correctes à l'objet question
        p.setCorrectAnswers(args.cor);

        // Ajoute la question au tableau des questions parsées
        this.parsedQuestion.push(p);

        if (input.length > 0) {
            this.question(input);
        }
        return true;
    } else {
        this.errMsg("Erreur au parseur pour créer la question", input);
        return false;
    }
*/
GiftParser.prototype.question = function(input) {
    if (!input || input.length === 0 || !input[0]) {
        console.error("Erreur : Input vide ou ligne invalide détectée.");
        return false;
    }

    if (matched = input[0].match(/::\s*(.*?)\s*::\s*(.*)?/)) {
        const args = this.body(input); // Récupère les données parsées

        // Crée l'objet question avant l'extraction des réponses et des commentaires
        var p = new question(args.tit, args.sent, "MC", [], []);

        // Passe l'objet `p` pour mettre à jour directement son champ `commentaire`
        args.cor = this.extractCorrectAnswers(args.sent, p);

        // Assignez les réponses correctes à l'objet question
        p.setCorrectAnswers(args.cor);

        // Ajoute la question au tableau des questions parsées
        this.parsedQuestion.push(p);

        if (input.length > 0) {
            this.question(input);
        }
        return true;
    } else {
        this.errMsg("Erreur au parseur pour créer la question", input);
        return false;
    }
};

// Récupère les différentes variables :
GiftParser.prototype.body = function(input) {
    const tit = this.title(input);
    const sent = this.sentence(input);

    // Retourne uniquement les données nécessaires
    return {
        tit: tit,
        sent: sent
    };
};



// titre = “::”  TEXT  “::”
GiftParser.prototype.title = function(input){
	if(matched = input[0].match(/::\s*(.*?)\s*::\s*(.*)?/)){
	return matched[1];
	}
	else{
		this.errMsg("Invalid title", input);
	}
}


// sent = tout ce qui est après “::”  TEXT  “::”, sur la même ligne et ce jusqu'à la prochaine question / fin du fichier
/* ancien snetence
GiftParser.prototype.sentence = function(input){
	let texte = [];
	if(matched = input[0].match(/::\s*(.*?)\s*::\s*(.*)?/)){
		if(matched[2]){
			texte.push(matched[2]);
			}
		}
		else{
			this.errMsg("Invalid title (for sentence)", input);
		}
	this.next(input);
	if (input.length > 0) {
	while(input.length > 0){
		if(matched = input[0].match(/::\s*(.*?)\s*::\s*(.*)?/)){
		break;
		}
		texte.push(input[0]);
		this.next(input);
	}
	}
	return(texte);
}
*/
GiftParser.prototype.sentence = function(input) {
    let texte = [];
    if (matched = input[0].match(/::\s*(.*?)\s*::\s*(.*)?/)) {
        if (matched[2]) {
            texte.push(matched[2]);
        }
    } else {
        this.errMsg("Invalid title (for sentence)", input);
    }
    this.next(input);
    while (input.length > 0) {
        if (matched = input[0].match(/::\s*(.*?)\s*::\s*(.*)?/)) {
            break;
        }
        texte.push(input[0]);
        this.next(input);
    }
    return texte.join(" ").replace(/\s+/g, ' ').trim();
};


GiftParser.prototype.correctAnswer = function(input){
	let texte = [];
	if(matched = input[0].match(/::\s*(.*?)\s*::\s*(.*)?/)){
		if(matched[2]){
			texte.push(matched[2]);
			}
		}
		else{
			this.errMsg("Invalid title (for sentence)", input);
		}
	this.next(input);
	if (input.length > 0) {
	while(input.length > 0){
		if(matched = input[0].match(/::\s*(.*?)\s*::\s*(.*)?/)){
		break;
		}
		texte.push(input[0]);
		this.next(input);
	}
	}
	return(texte);
}

function tableauxEgaux(tab1, tab2) {
    if (tab1.length !== tab2.length) return false; 
    return tab1.every((val, index) => val === tab2[index]); 
}


GiftParser.prototype.extractCorrectAnswers = function(sentence, question) {
    const regexMC = /{[^:]*:MC:~?=(.*?)(~|})/g; // Questions à choix multiple (MC)
    const regexSA = /{[^:]*:SA:=(.*?)(~|})/g; // Questions à réponse courte (SA)
    const regexOthers = /{=(.*?)(~|#|})/g; // Questions générales sans type explicite
    const regexOptions = /(~=|~)([^~}]*)(?=[~}])/g; // Options avec ~ ou ~=
    const regexComment = /#([^~}]*)/; // Extraction des commentaires
	const regexOptionsDuo = /(~=|~|=)([^~}]*)(?=[~}])/g;
	const regexMixed = /(~[^=]*=)([^~}]*)(?=[~}])/g;
	const regexCollocations = /=(.*?)\s*->\s*(.*?)(?=\s*=|$)/g; // Extraction des collocations
	const regexFieldBigGap = /{ =(.*?)(~|#|})/g; 
	const regexNombre =  /{#(.*?)(~|#|})/g;
	const regexBoolean = /{( TRUE| FALSE|TRUE|FALSE)(#.*?)?}/g;
	

    let correctAnswers = [];
    let optionQcm = [];
    let match;
	let collocations = [];
	let comments = [];

	
    // Vérifiez si la question est de type MC ou SA
    const isMultipleChoice = sentence.includes(":MC:");
    const isShortAnswer = sentence.includes(":SA:");
	const isCollocations = regexCollocations.test(sentence);
	const isBoolean = regexBoolean.test(sentence);
	console.log(regexBoolean.exec(sentence));

    if (isCollocations) {
        console.log("Processing Collocations...");
        while ((match = regexCollocations.exec(sentence)) !== null) {
            collocations.push({ key: match[1].trim(), value: match[2].trim() });
            correctAnswers.push(match[1].trim() + " -> " + match[2].trim());
        }
        question.type = "Collocations";
		question.collocations = collocations;
    } else if (isMultipleChoice) {
        // Extraction des réponses multiples (MC)
        while ((match = regexMC.exec(sentence)) !== null) {
            correctAnswers = correctAnswers.concat(
                match[1].split('=').map(answer => answer.trim())
            );
        }
    } else if (isShortAnswer) {
        // Extraction des réponses courtes (SA)
        while ((match = regexSA.exec(sentence)) !== null) {
            correctAnswers = correctAnswers.concat(
                match[1].split('=').map(answer => answer.trim())
            );
        }
    } else if (isBoolean) {
		while ((match = regexBoolean.exec(sentence)) !== null) {
			console.log("Match trouvé pour BOOLEAN :", match);
	
			// Ajoute TRUE ou FALSE dans les réponses correctes
			if (match[1]) {
				correctAnswers.push(match[1].trim());
			}
	
			// Gestion des commentaires
			if (match[2]) {
				const extractedComments = match[2]
					.split('#')
					.slice(1) // Ignore le premier élément vide avant le premier #
					.map(c => c.trim()); // Supprime les espaces autour des commentaires
				question.commentaire = extractedComments.join(" | "); // Combine les commentaires
			}
		}
		question.type = "Boolean"; // Définit le type de question
	} else {
        // Extraction des réponses générales
        while ((match = regexOthers.exec(sentence)) !== null) {
            correctAnswers = correctAnswers.concat(
                match[1].split('=').map(answer => answer.trim())
            );
        }

		while ((match = regexFieldBigGap.exec(sentence)) !== null) {
			const answersWithComments = match[1]
				.split('=') // Divise les réponses par `=`
				.map(answer => {
					const [text, comment] = answer.split('#'); // Sépare la réponse du commentaire (si présent)
					return {
						answer: text.trim(), // Texte de la réponse
						comment: comment ? comment.trim() : null // Commentaire ou null
					};
				});
		
			// Ajoute les réponses aux réponses correctes
			correctAnswers = correctAnswers.concat(
				answersWithComments.map(item => item.answer)
			);
		
			// Ajoute les commentaires associés
			const extractedComments = answersWithComments
				.filter(item => item.comment) // Filtre uniquement les réponses avec commentaires
				.map(item => item.comment); // Récupère les commentaires
		
			if (extractedComments.length > 0) {
				comments = comments.concat(extractedComments); // Ajoute les commentaires au tableau global
			}
		}
		

		while ((match = regexNombre.exec(sentence)) !== null) {
            correctAnswers = correctAnswers.concat(
                match[1].split('=').map(answer => answer.trim())
            );
			question.type = "nombre";
        }

		while ((match = regexOptions.exec(sentence)) !== null) {
            const prefix = match[1];
            const answer = match[2].trim(); 

            if (prefix === '=' || prefix === '~=') {
                correctAnswers.push(answer); 
            }
            optionQcm.push(answer);
        }

        // Extraction des réponses duo pour les questions sans type explicite
        while ((match = regexOptionsDuo.exec(sentence)) !== null) {
            const prefix = match[1];
            const answer = match[2].trim(); 

            if (prefix === '=') {
                correctAnswers.push(answer);
            } 
            optionQcm.push(answer);
        }

		while ((match = regexMixed.exec(sentence)) !== null) {
            const badAnswer = match[1].replace("~", "").replace("=", "").trim();
            const goodAnswer = match[2].trim(); 
            correctAnswers.push(goodAnswer);
            optionQcm.push(badAnswer, goodAnswer);
        }
    }

    // Suppression des doublons et des option vrai=faux
    optionQcm = [...new Set(optionQcm.filter(option => !option.includes('=')).filter(option => !option.includes('~')))];
	correctAnswers = [...new Set(correctAnswers.filter(option => !option.includes('=')).filter(option => !option.includes('~')))];

	if(question.type !== "nombre"){
		// Extraction du commentaire
		const commentMatch = regexComment.exec(sentence);
		if (commentMatch) {
			question.commentaire = commentMatch[1].trim();
		} else {
			question.commentaire = null;
		}
	}

    // Mise à jour des champs de l'objet question
	question.correctAnswers = correctAnswers;
    question.answers = optionQcm;

	if (tableauxEgaux(question.correctAnswers, question.answers)) {
		question.answers = [];
		question.type = "gapField";
	}

    console.log("Type de question:", isMultipleChoice ? "MC" : isShortAnswer ? "SA" : "Autre");
    console.log("Correct Answers:", correctAnswers);
    console.log("Options:", optionQcm);
    console.log("Commentaire:", question.commentaire);

    return correctAnswers;
};

module.exports = GiftParser;