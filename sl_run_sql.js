/**
 * SuiteQL Query Executor
 * Runs arbitrary SuiteQL queries in an interactable Suitelet
 *
 * @author Steve Rolfechild
 * @NScriptType Suitelet
 * @NApiVersion 2.x
 */
define(['N/query', 'N/ui/serverWidget', 'N/log'], function(query, serverWidget, log) {
	function runQuery(sql) {
		var response = { columns: [], rows: [], error: undefined };
		
		try {
			var result = query.runSuiteQL({ query: sql });
		} catch (e) {
			response.error = e.message;
			return response;
		}
		
		for (var i = 0; i < result.results.length; i++) {
			if (response.columns.length == 0) {
				response.columns = Object.keys(result.results[i].asMap());
			}
			response.rows.push(result.results[i].values);
		}
		
		return response;
	}
	
	return {
		onRequest: function(context) {
			var form = serverWidget.createForm({ title: 'Run SuiteQL Query' });
			
			// SQL capture field
			var sql_field = form.addField({
				id: 'custpage_sql_field',
				type: serverWidget.FieldType.TEXTAREA,
				label: 'Query'
			});
			sql_field.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });
			sql_field.updateDisplaySize({ height: 15, width: 150 });
			
			if (context.request.method === 'POST'){
				// Log and run query
				log.debug('Query', context.request.parameters.custpage_sql_field);
				sql_field.defaultValue = context.request.parameters.custpage_sql_field;
				var result = runQuery(context.request.parameters.custpage_sql_field);
				
				if (result.rows.length > 0) {
					// Output result
					var result_list = form.addSublist({
						id: 'sublist',
						type: serverWidget.SublistType.LIST,
						label: 'Results'
					});
					
					// Headers
					for (var ii = 0; ii < result.columns.length; ii++) {
						result_list.addField({
							id: 'custpage_' + ii + '_field',
							label: result.columns[ii],
							type: serverWidget.FieldType.TEXTAREA
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
				} else {
					// Show error
					var error_message;
					if (result.error == undefined) {
						error_message = '<div style="font-size:20pt; margin-top:50px;">0 results found</div>';
					} else {
						error_message = '<div style="font-size:14pt; color: red;">' + result.error + '</div>';
					}
					
					form.addField({
						id: 'custpage_error_field',
						type: serverWidget.FieldType.INLINEHTML,
						label: ' '
					}).updateBreakType({
						breakType: serverWidget.FieldBreakType.STARTROW
					}).defaultValue = error_message;
				}
			} else {
				sql_field.default_value = "SELECT TO_CHAR(SYSDATE, 'MM-DD-YYYY HH24:MI:SS')"
			}
			
			form.addSubmitButton({ label: 'Run Query' });
			
			context.response.writePage(form);
		}
	}
});
