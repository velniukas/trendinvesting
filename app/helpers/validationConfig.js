// Folio Configs
module.exports.folio = {

	createFolio : {
		title : {required: true},
		description : {required : true},
		iconImage : {required:true},
		wallImage : {required:true}
	},

	editFolio : {
		title : {required: true},
		description : {required : true},
		iconImage : {required:true},
		wallImage : {required:true}
	}

};

// Tags Configs
module.exports.tag = {

	createTag : {
		title : {required:true},
		description : {required: true}
	},

	editTag : {
		title : {required:true},
		description : {required: true}
	}
};

// User Profile
module.exports.user = {

	profileUpdate : {
		name : {required: true},
		email : {required: true , email : true},
	}
};

