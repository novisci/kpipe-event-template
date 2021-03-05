A field specifier has the form: \
  $fieldName{length}(type)/lookup

With: \
  fieldName - property to retrieve from data \
  length - truncate data value to length \
  type - convert value to the supplied type [integer, number, ymdate, nodecimal, npi] \
  lookup - translate the retrieved value using a table name

Only $fieldName is required and optional modifiers mey be omitted, but must appear
in the same sequence. Examples:

  $FIELD1 \
  $FIELD2(fromDateString) \
  $FIELD2{5}(integer) \
  $FIELD4/table_xref \
  $FIELD5(nodecimal)/table2_xref

Note: \
  Evaluation of the final value follows left to right order: \

    $fieldName -> {length} -> (type) -> /lookup

Type conversion functions (type):

  (integer) - convert to base-10 integer \
  (number) - convert to floating point number \
  (ymdate) - convert year/month date (YYYYMM) to full date (YYYY-MM-15) \
  (nodecimal) - deprecated alias for (trimdecimal) \
  (trimdecimal) - truncate the first decimal and any subsequent characters (XX.YY becomes XX)  \
  (npi) - pass only "valid" npi values, convert to null if length < 6 \
  (fromDateString) - convert any JS defined date format into YYYY-MM-DD \
  (trim) - remove any leading or trailing whitespace characters \
  (skipdecimal) - remove any embedded decimals (XX.YY becomes XXYY)