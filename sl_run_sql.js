/**
 * @NScriptType Suitelet
 * @NApiVersion 2.x
 */
define(['N/query', 'N/ui/serverWidget', 'N/log'], function(query, serverWidget, log) {
	function runQuery(sql) {
		var result = query.runSuiteQL({ query: sql });
		
		var response = { columns: [], rows: [] };
		for (var i = 0; i < result.results.length; i++) {
			if (response.columns.length == 0) {
				// Only way I could figure out how to get access to columns returned. Or via Query.asMappedResult()
				response.columns = Object.keys(result.results[i].asMap());
			}
			response.rows.push(result.results[i].values);
		}
		
		return response;
	}
	
	return {
		onRequest: function(context) {
			var form = serverWidget.createForm({ title: 'Run SQL' });
			
			var sql_field = form.addField({
				id: 'custpage_sql_field',
				type: serverWidget.FieldType.LONGTEXT,
				label: 'SQL'
			});
			sql_field.layoutType = serverWidget.FieldLayoutType.NORMAL;
			sql_field.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });
			sql_field.updateDisplaySize({ height: 25, width: 150 });
			
			if (context.request.method === 'POST'){
				log.debug('should run query', context.request.parameters.custpage_sql_field);
				sql_field.defaultValue = context.request.parameters.custpage_sql_field;
				var result = runQuery(context.request.parameters.custpage_sql_field);
				
				if (result.rows.length > 0) {
					// Output result
					var result_list = form.addSublist({
						id: 'sublist',
						type: serverWidget.SublistType.LIST,
						label: 'SQL Results'
					});
					// Headers
					for (var ii = 0; ii < result.columns.length; ii++) {
						result_list.addField({
							id: 'custpage_' + ii + '_field',
							label: result.columns[ii],
							type: serverWidget.FieldType.TEXT
						});
					}
					// Data
					var sublist = form.getSublist({ id: 'sublist' });
					for (var row_num = 0; row_num < result.rows.length; row_num++) {
						for (var col_num = 0; col_num < result.rows[row_num].length; col_num++) {
							sublist.setSublistValue({
								id: 'custpage_' + col_num + '_field',
								line: row_num,
								value: result.rows[row_num][col_num]
							});
						}
					}
				}
			} else {
				sql_field.defaultValue = "SELECT * FROM paymentEvent";
			}
			
			form.addSubmitButton({ label: 'Run SQL' });
			
			context.response.writePage(form);
		}
	}
});
