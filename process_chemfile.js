//Function to process the file with chemical structures, non-blocking execution, SEE: https://stackoverflow.com/questions/10344498/best-way-to-iterate-over-an-array-without-blocking-the-ui?noredirect=1&lq=1
const process_chemFile = async function (supplier, scaff_type, processing_variant) {
//V A R I A N T S
// 1  ->  visual assessment of diversity
// 2  ->  accessing the numeric property
// 3  ->  accessing the string property
// set the number of columns needed depending on the VARIANT #red
let columns_needed;
if (processing_variant < 2) {
	columns_needed = 2;
} else {
	columns_needed = 3;
}
console.log(columns_needed);
event.preventDefault();
//Some consts
const svg_container = document.querySelector("#svg_container");
const input_one = document.querySelector("#input_one");
const input_two = document.querySelector("#input_two");
const progress_bar = document.querySelector("#progress_bar");
const n_max_structs = 10000;
const data_toServer = {};
const allowed_extensions = new Set( ["TAB", "TSV", "CSV", "SDF"] );
//Numbers for reporting
let n_input_records;
let n_valid_structs;
let n_2upload_structs;
//Use Promise here to read the file, SEE: https://developer.mozilla.org/en-US/docs/Web/API/FileReader/result
const file_reader = (file) =>
	new Promise((resolve, reject) => {
	const fr = new FileReader();
	fr.onload = () => resolve(fr);
	fr.onerror = (err) => reject(err);
	fr.readAsText(file);
});
//Check the existence
if ( typeof supplier.files[0] != "undefined" ) {
	//Get the extension
	extension = (supplier.files[0]['name'].slice(supplier.files[0]['name'].lastIndexOf(".") + 1)).toUpperCase();
	//Check size
	if (supplier.files[0]['size'] <= 41001000) {
		//Check extension
		if ( allowed_extensions.has(extension) ) {
		//Tell the user
		new M.Toast({html: 'Processing the file'});
		input_one.hidden = true;
		input_two.hidden = true;
		//Prepare to hold the string from file
		let data_raw;
		//Prepare to hold the parsed data
		let data_parsed;
		//Prepare to hold the pre-parsed data (SDF)
		let data_preparsed;
		//Prepare to hold the validated date
		let data_validated = [];
		//Get the data
		let data_promise = file_reader(supplier.files[0]);
		try {
			data_file = await data_promise;
		} catch (err) {
			new M.Toast({html: 'Something wrong with the file, try again'});
			input_one.hidden = false;
			input_two.hidden = false;
			svg_container.style.display = 'none';
			return;
		}
		data_raw = data_file.result;
		//Process accordingly
		switch (extension) {
		 	case 'TAB':
		 		let tab_config = {delimiter: "\t", header: false, skipEmptyLines: true};
		 		//Skip headers manually
		 		data_raw = data_raw.substring(data_raw.indexOf("\n") + 1);
		 		data_parsed = Papa.parse(data_raw, tab_config);
		 		//Check for errors:
		 		if (data_parsed.errors.length) {
		 			new M.Toast({html: `Something is wrong with the data structure: \"${data_parsed.errors[0]['message']}\"`});
		 			input_one.hidden = false;
					input_two.hidden = false;
					svg_container.style.display = 'none';
		 			return;
		 		}
		 		data_parsed = data_parsed['data'];
		 		if (data_parsed[0].length < columns_needed) {
		 			new M.Toast({html: `Something is wrong with the data structure: \"Less than ${columns_needed} columns\"`});
		 			input_one.hidden = false;
					input_two.hidden = false;
					svg_container.style.display = 'none';
		 			return;
		 		}
		 		break;
		 	case 'TSV':
		 		let tsv_config = {delimiter: "\t", header: false, skipEmptyLines: true};
		 		//Skip headers manually
		 		data_raw = data_raw.substring(data_raw.indexOf("\n") + 1);
		 		data_parsed = Papa.parse(data_raw, tsv_config);
		 		//Check for errors:
		 		if (data_parsed.errors.length) {
		 			new M.Toast({html: `Something is wrong with the data structure: \"${data_parsed.errors[0]['message']}\"`});
		 			input_one.hidden = false;
					input_two.hidden = false;
					svg_container.style.display = 'none';
		 			return;
		 		}
		 		data_parsed = data_parsed['data'];
		 		if (data_parsed[0].length < columns_needed) {
		 			new M.Toast({html: `Something is wrong with the data structure: \"Less than ${columns_needed} columns\"`});
		 			input_one.hidden = false;
					input_two.hidden = false;
					svg_container.style.display = 'none';
		 			return;
		 		}
		 		break;
		 	case 'CSV':
		 		let сsv_config = {header: false, skipEmptyLines: true, delimitersToGuess: [',', ';']};
		 		//Skip headers manually
		 		data_raw = data_raw.substring(data_raw.indexOf("\n") + 1);
		 		data_parsed = Papa.parse(data_raw, сsv_config);
		 		//Check for errors:
		 		if (data_parsed.errors.length) {
		 			new M.Toast({html: `Something is wrong with the data structure: \"${data_parsed.errors[0]['message']}\"`});
		 			input_one.hidden = false;
					input_two.hidden = false;
					svg_container.style.display = 'none';
		 			return;
		 		}
		 		data_parsed = data_parsed['data'];
		 		if (data_parsed[0].length < columns_needed) {
		 			new M.Toast({html: `Something is wrong with the data structure: \"Less than ${columns_needed} columns\"`});
		 			input_one.hidden = false;
					input_two.hidden = false;
					svg_container.style.display = 'none';
		 			return;
		 		}
		 		break;
		 	case 'SDF':
		 		global_input_type = 'sdf';
		 		//Prepare vars to store SDF fields
		 		let mol_mol;
		 		let mol_id;
		 		let mol_data;
		 		let mol_validated;
		 		let smiles_validated;
		 		let data_parsed_validity = 1;
		 		//Prepare data_parsed to store the results
		 		data_parsed = [];
		 		//Prepare string for papaparsing
		 		data_raw = data_raw.replaceAll(/(\r\n|\r|\n)/g, "_#e-o-l#_");
		 		data_raw = data_raw.replaceAll("$$$$_#e-o-l#", "\r\n");
		 		let sdf_config = {delimiter: "_#e-o-l#_>", header: false, skipEmptyLines: false};
		 		data_preparsed = Papa.parse(data_raw, sdf_config);
		 		test_preparsed = data_preparsed;
		 		//Check for errors:
		 		if (data_preparsed.errors.length) {
		 			new M.Toast({html: `Something is wrong with the data structure`});
		 			input_one.hidden = false;
					input_two.hidden = false;
					svg_container.style.display = 'none';
		 			return;
		 		}
		 		data_preparsed = data_preparsed['data'];
		 		data_preparsed.pop();
		 		//Make SDF records OK and select first 3 fields (MOL, ID, DATA)
		 		for (let i = 0; i < data_preparsed.length; i++) {
		 			if (typeof data_preparsed[i][0] != "undefined" && typeof data_preparsed[i][1] != "undefined") {
		 				mol_mol = data_preparsed[i][0].replaceAll("_#e-o-l#_", "\r\n");
		 				mol_id  = (( data_preparsed[i][1].replace(/^.+?(?=_#e-o-l#_)_#e-o-l#_/, "") ).replaceAll("_#e-o-l#_", "\r\n") ).trim();
		 				if (typeof data_preparsed[i][2] != "undefined") {
		 					mol_data  = (( data_preparsed[i][2].replace(/^.+?(?=_#e-o-l#_)_#e-o-l#_/, "") ).replaceAll("_#e-o-l#_", "\r\n") ).trim();
		 				} else {mol_data = "";}
		 				data_parsed.push([mol_id, mol_mol, mol_data]);
		 			} else {
		 				new M.Toast({html: `Something is wrong with the data structure: \"Less than two columns for the record ${i+1}\"`});
		 				input_one.hidden = false;
						input_two.hidden = false;
						svg_container.style.display = 'none';
		 				return;
		 			}
				}
		}
		//Count records
		n_input_records = data_parsed.length;
		//Break if the number of records > 15000
		if (n_input_records > 20000) {
			new M.Toast({html: 'Input have too many records: > 20000'});
			input_one.hidden = false;
			input_two.hidden = false;
			svg_container.style.display = 'none';
			return;
		}
		//Prepare the data to store
		console.log(`n_input_records: ${n_input_records}`);
		console.log(`RDKit starts computations, minutes: ${new Date().getMinutes()}, seconds: ${new Date().getSeconds()}`);
		//Validate structures
		let chunker = 0;
		for (let i = 0; i < data_parsed.length; i++) {
			mol_validated = RDKit.get_mol(data_parsed[i][1]);
			try {
				smiles_validated = mol_validated.get_smiles();
			} catch(error) {
				smiles_validated = -1;
			}
			//Delete the processed mol to free the memory, SEE:
			try {
				mol_validated.delete();
			} catch(error) {
				console.log(`index: ${i}`);
				continue;
			}
			if (smiles_validated != -1) {
				data_validated.push( [data_parsed[i][0], btoa(smiles_validated), data_parsed[i][2], btoa(data_parsed[i][1])] );
			}
			//Provide the responsive UI
			chunker = chunker + 1;
			if (chunker === 60) {
				await new Promise(resolve => setTimeout(resolve, 0));
				chunker = 0;
			}
		}
		console.log(`RDKit ends computations, minutes: ${new Date().getMinutes()}, seconds: ${new Date().getSeconds()}`);
		let n_valid_structs = data_validated.length;
		//Check if * is OK
		if (n_valid_structs < 1) {
			new M.Toast({html: 'There are no valid structures in file'});
			input_one.hidden = false;
			input_two.hidden = false;
			svg_container.style.display = 'none';
			return;
		}
		console.log(`n_valid_structs: ${n_valid_structs}`);
		//Select 10000 structures MAX
		if (n_valid_structs > 10000) {
			data_validated = data_validated.slice(0, 10000);
			n_valid_structs = data_validated.length;
			new M.Toast({html: `Number of valid structures > 10000, only 10000 are allowed`});
		}
		//Report
		new M.Toast({html: `The file is processed: ${n_input_records} records, ${n_valid_structs} valid structures, ${data_validated.length} structures will be uploaded`});
		//Generate new IDs to prevent the transfer of not validated data to the server (only structures are validated)
		data_toServer.data = [];
		for (let i = 0; i < data_validated.length; i++) {
			data_validated[i][4] = 'structure_' + i;
			data_toServer.data.push([data_validated[i][4], data_validated[i][1]]);
		}
		console.log("DATA VALIDATED");
		console.log(data_validated);
		console.log("DATA TO SERVER");
		console.log(data_toServer);
		//Gather data to JSON
		data_toServer.meta = {"scaffold_type": scaff_type, "max_range": selected_value, "n_input_records": n_input_records, "n_valid_structs": n_valid_structs};
		//Send to the srever
		let response = await fetch('process.php', {
			method: 'POST',
			headers: {'Content-Type': 'application/json;charset=utf-8'},
 				body: JSON.stringify(data_toServer)
		});
		let result = await response.json();
		result_json = JSON.parse(result);
		new M.Toast({html: `From server: ${JSON.stringify(result_json['meta'])}`});
		console.log(result_json);
		if (processing_variant < 2) {
			return {'result': result_json};
		} else {
			return {'result': result_json, 'data': data_validated, 'processing_variant': processing_variant};
		}

		} else {
			new M.Toast({html: 'Upload one of the following: .TSV, .TAB, .CSV or .SDF'});
			input_one.hidden = false;
			input_two.hidden = false;
			svg_container.style.display = 'none';
			return;
		}
	} else {
			new M.Toast({html: 'File is too big: > 40 Mb'});
			input_one.hidden = false;
			input_two.hidden = false;
			svg_container.style.display = 'none';
			return;
		}
} else {
	new M.Toast({html: 'Provide the file, please'});
	input_one.hidden = false;
	input_two.hidden = false;
	svg_container.style.display = 'none';
	return;
}}