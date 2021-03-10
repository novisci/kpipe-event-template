# `kpipe-event-template`

This library compiles pre-defined JavaScript object "templates" and, through the use of
a syntax for referencing externally provided values, replaces the embedded references with
data values provided as a JavaScript array.

The primary use-case for this library is the conversion of successive rows of CSV data into
a JavaScript object structure using the embedded references to the CSV row data named by their
headers.

The library converts the template's field references into objects which provide a custom `toJSON()` function
which directly produces the field reference's value given the current row of data. This ensures that
the expensive parsing of the field reference syntax is performed once producing a single function returning the
value of that field reference for a given row of data.

For example:

```javascript
const { compileTemplate, RowData, TableCache, getTemplateValue } = require('kpipe-event-template')

// Create a container for each row of data, compiled templates observe this
//  container when converting references to values
const rowData = new RowData()

// The table cache will load JSON lookup tables from the specified path. They
//  are lazy-loaded on first reference and kept in memory for subsequent lookups
const tableCache = new TableCache('./lookup_tables_path')

// Describe the names of the rows of data (the CSV header)
const headers = ['VAL1', 'VAL2', 'VAL3', 'VAL4']

// The template object
const template = { A: "$VAL1", B: "$VAL2", C: [ "$VAL3", "$VAL4" ]}

// Compile the template once
const compiled = compileTemplate(template, headers, tableCache, rowData)

const data = [
  ['1', '2', '3', '4'],
  ['one', 'two', 'three', 'four'],
  ['uno', 'dos', 'tres', 'cuatro']
]

// Call setRowData() for each row of data, then simply stringify the template
//  and the row values are substituted into the value of the template
data.forEach((d) => {
  rowData.setRowData(d)
  console.log(JSON.stringify(compiled))
})
```

Output:

```json
{"A":"1","B":"2","C":["3","4"]}
{"A":"one","B":"two","C":["three","four"]}
{"A":"uno","B":"dos","C":["tres","cuatro"]}
```

Alternatively, you can retrieve the value of the template as a JavaScript object (not stringified)

```javascript
// Set the data for a row and retrieve the template value as 
//  a JavaScript object
rowData.setRowData([['1', '2', '3', '4']])
getTemplateValue(compiled)
```

Returns:

```javascript
{
  A: '1',
  B: '2',
  C: ['3', '4']
}
```

## Field reference syntax

There are two syntaxes for substituting the embedded field references into data coming from the
current row of data.

### **Field Specifiers**

A field specifier has the form: \
  `$fieldName{length}(type)/lookup`

With: \
  `fieldName` - property to retrieve from data \
  `length` - truncate data value to length \
  `type` - convert value to the supplied type [integer, number, ymdate, nodecimal, npi] \
  `lookup` - translate the retrieved value using a table name

Only $fieldName is required and optional modifiers mey be omitted, but must appear
in the same sequence. Examples:

  `$FIELD1` \
  `$FIELD2(fromDateString)` \
  `$FIELD2{5}(integer)` \
  `$FIELD4/table_xref` \
  `$FIELD5(nodecimal)/table2_xref`

Note: \
  Evaluation of the final value follows left to right order: \

  `$fieldName` -> `{length}` -> `(type)` -> `/lookup`

Type conversion functions (type):

| Modifier | Description |
|---|---|
`(integer)`|convert to base-10 integer|
`(number)`|convert to floating point number|
`(ymdate)`|convert year/month date (YYYYMM) to full date (YYYY-MM-15)|
`(nodecimal)`|deprecated alias for (trimdecimal)|
`(trimdecimal)`|truncate the first decimal and any subsequent characters (XX.YY becomes XX)|
`(npi)`|pass only "valid" npi values, convert to null if length < 6|
`(fromDateString)`|convert any JS defined date format into YYYY-MM-DD|
`(trim)`|remove any leading or trailing whitespace characters|
`(skipdecimal)`|remove any embedded decimals (XX.YY becomes XXYY)|


### **Field Expressions**

A field expression has the form: \
  `${expression}`

Field expressions allow for more complex field lookups to be performed. Field expressions can replace
field specifiers in many cases, but may also be embedded in a field specifier to dynamically determine the field name in the specifier. Field expressions rely on the module `expr-eval` (https://www.npmjs.com/package/expr-eval) to evaluate the result of the field expression.

Examples:

| Expression | Description |
|---|---|
|`${FIELD1}`|Retrieve the value of FIELD1 (synonymous with $FIELD) |
|`$${IT}`|Retrieve the value of IT which determines the name of the field in the resulting field specifier |
|`${concat(FIELD1, '-', FIELD2)}`|Returns value of FIELD1 concatenated with a hyphen and the value of FIELD2 |
|`${ifelse(FIELD1, FIELD2, FIELD3)}`|If FIELD1 evaluates to true, return the value of FIELD2, otherwise return the value of FIELD3|


> Note: Field expressions are evaluated first, then the resulting string is treated as a field specifier if it begins with a `$`. This produces the odd looking double `$$` pattern (eg.`$${VAR}`). Only
the fieldName portion of a field specifier may be produced by a field expression, for example, `$${VAR}/lookup-table`. The following is invalid: `$FIELD1/${TABLE_NAME}`

Field expressions can utilize variables which are not part of the data row. You may provide an
object of statically defined variables when compiling a template containing field expressions.

```javascript
const compiled = compileTemplate(['$FIELD1', '${VAR1}'], ['FIELD1'], tableCache, rowData, {
  VAR1: 'variable1'
})

rowData.setRowData(['value1'])
JSON.stringify(compiled)
rowData.setRowData(['value2'])
JSON.stringify(compiled)
```

Output:

```json
["value1","variable1"]
["value2","variable1"]
```