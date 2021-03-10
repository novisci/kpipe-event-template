# `kpipe-event-template`

This library compiles pre-defined JavaScript object "templates" and, through the use of
a syntax for referencing externally provided values, replaces the embedded references with
data values provided as a JavaScript array.

The primary use-case for this library is the conversion of successive rows of CSV data into
a JavaScript object structure using the embedded references to the CSV row data named by their
headers.

For example:

```
const { compileTemplate, RowData, TableCache } = require('kpipe-event-template')

const rowData = new RowData()
const tableCache = new TableCache('./lookup_tables_path')
const headers = ['VAL1', 'VAL2', 'VAL3', 'VAL4']

const template = { A: "$VAL1", B: "$VAL2", C: [ "$VAL3", "$VAL4" ]}

conse compiled = compileTemplate(template, headers, tableCache, rowData)

const data = [
  ['1', '2', '3', '4'],
  ['one', 'two', 'three', 'four'],
  ['uno', 'dos', 'tres', 'cuatro']
]

data.forEach((d) => {
  rowData.setRowData(d)
  console.log(JSON.stringify(compiled))
})
```

Output:

```
{"A":"1","B":"2","C":["3","4"]}
{"A":"one","B":"two","C":["three","four"]}
{"A":"uno","B":"dos","C":["tres","cuatro"]}
```

## Retrieving field values

There are two syntaxes for substituting the embedded field references into data coming from the
current row of data.

### Field Specifiers

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

    `$fieldName -> {length} -> (type) -> /lookup`

Type conversion functions (type):

  `(integer)` - convert to base-10 integer \
  `(number)` - convert to floating point number \
  `(ymdate)` - convert year/month date (YYYYMM) to full date (YYYY-MM-15) \
  `(nodecimal)` - deprecated alias for (trimdecimal) \
  `(trimdecimal)` - truncate the first decimal and any subsequent characters (XX.YY becomes XX)  \
  `(npi)` - pass only "valid" npi values, convert to null if length < 6 \
  `(fromDateString)` - convert any JS defined date format into YYYY-MM-DD \
  `(trim)` - remove any leading or trailing whitespace characters \
  `(skipdecimal)` - remove any embedded decimals (XX.YY becomes XXYY)

### Field Expressions