var test = require('tape')
var str = require('../')

function vars (chr) {
  var str = String.fromCharCode(chr)
  return ('あいうえおかきくけこさしすせそはひふへほ…'.indexOf(str) !== -1) ? 2 : 1
}

function validateOrder (t, compareAll, widths) {
  var pos = 0
  return function (c, cBefore) {
    if (pos > 0) {
      t.equal(c, compareAll[pos].c.charCodeAt(0))
      if (compareAll[pos].cBefore === undefined) {
        t.equal(cBefore, undefined)
      } else {
        t.equal(cBefore, compareAll[pos].cBefore.charCodeAt(0))
      }
    }
    var width = compareAll[pos].width
    if (pos >= compareAll.length) {
      t.fail('too many calls')
    }
    ++pos
    return width
  }
}

function wrap (string, width) {
  return str(string, vars).wrap(width)
}

function substring (string, from, to) {
  return str(string, vars).substring(from, to).string
}

function substr (string, from, to) {
  return str(string, vars).substr(from, to).string
}
function width (string) {
  return str(string, vars).width()
}

function size (string) {
  return str(string, vars).size()
}

function truncate (string, width, suffix) {
  return str(string, vars).truncate(width, suffix)
}

function sizeBeforeFirst (string, search, offset) {
  return str(string, vars).sizeBeforeFirst(search, offset)
}

test('width of a simple, single character', function (t) {
  t.equal(str('a', validateOrder(t, [
    {c: 'a', cBefore: undefined, width: 1}
  ])).width(), 1)
  t.end()
})
test('width of a string', function (t) {
  t.equal(str('abc', validateOrder(t, [
    {c: 'a', cBefore: undefined, width: 1},
    {c: 'b', cBefore: 'a', width: 1},
    {c: 'c', cBefore: 'b', width: 1}
  ])).width(), 3)
  t.end()
})
test('special cases', function (t) {
  t.equal(width(''), 0, 'empty string')
  t.end()
})
test('width of a multiline string', function (t) {
  t.equal(width('a\nb'), 1, 'the widest line is 0 between two lines with two regular chars')
  t.equal(width('aa\nb'), 2, 'the widest line is 0 with 2 chars')
  t.equal(width('a\nbb'), 2, 'the widest line is 1 with 2 chars')
  t.equal(width('あ\nb'), 2, 'the widest line is 0 with a double width char')
  t.equal(width('ああ\naaaaa'), 5, 'the widest line is 1 with 5 regular chars')
  t.end()
})
test('size strings', function (t) {
  t.equal(size('abc'), 3, 'regular string size')
  t.equal(size('a\nb'), 3, 'count line breaks as 1')
  t.equal(size('aa\nb'), 4, 'count line breaks as 1 with 2 before the line break')
  t.equal(size('a\nbb'), 4, 'count line breaks as 1 with 2 after the line break')
  t.equal(size('あ\nb'), 4, 'double width characters mixed with space and regular character')
  t.equal(size('ああ\nいい'), 9, 'double width characters with space')
  t.end()
})
test('substring', function (t) {
  t.equal(substring('abcd', 0, 0), '', 'empty')
  t.equal(substring('abcd', 0, 1), 'a', 'simple')
  t.equal(substring('abcd', 1, 0), 'a', 'simple reverse')
  t.equal(substring('abcd', 2), 'cd', 'left over')
  t.equal(substring('abcd', -1, 1), 'a', 'start bounding')
  t.equal(substring('abcd', 3, 6), 'd', 'end bounding')
  t.equal(substring('abcd', 2, -1), 'ab', 'negative end bounding')
  t.equal(substring('abcd', 0, 4), 'abcd', 'whole string')
  t.equal(substring('abcd', 2, 3), 'c', 'character somewhere in the middle')
  t.equal(substring('abcd', 3, 4), 'd', 'character at the end')
  t.equal(substring('あいうえお', 0, 1), '', 'double width getting half a character')
  t.equal(substring('あいうえお', 0, 2), 'あ', 'double width getting a double character')
  t.equal(substring('あいうえお', 1, 2), '', 'double width getting half a character should ignore')
  t.equal(substring('あいうえお', 1, 3), '', 'double width getting two half a characters should be ignored')
  t.equal(substring('あいうえお', 1, 4), 'い', 'double width getting one and a half character should return the one included')
  t.equal(substring('あいうえお', 2, 6), 'いう', 'double width getting two characters correctly should retunr two')
  t.equal(substring('abcあいうえおdeg', 3, 6), 'あ', 'mixed width characters without a problem.')
  t.equal(substring('abc\ndef', 2, 5), 'c\nd', 'multiline')
  t.equal(substring('abあ\ndef', 2, 7), 'あ\nde', 'multiline, double width characters')
  t.end()
})
test('substr', function (t) {
  t.equal(substr('abcd', 1), 'bcd')
  t.end()
})
test('multiple line operations', function (t) {
  var s = str('abcd', vars)
  t.equal(s.wrap(2), 'ab\ncd')
  t.equal(s.wrap(2), 'ab\ncd')
  t.end()
})
test('sizeBeforeFirst', function (t) {
  t.equal(sizeBeforeFirst('abcd', 'c'), 2, 'Find a char')
  t.equal(sizeBeforeFirst('あbcd', 'c'), 3, 'Find a char after a double width char')
  t.equal(sizeBeforeFirst('abcdabcd', 'c'), 2, 'Make sure that it finds the first char')
  t.equal(sizeBeforeFirst('babaab', 'b', 3), 5, 'Find the third b')
  t.equal(sizeBeforeFirst('bab', 'b', 3), -1, 'Search after length should not work (contrast to next test)')
  t.equal(sizeBeforeFirst('bあb', 'b', 3), 3, 'Find a char with an offset pointing into a double width char')
  t.equal(sizeBeforeFirst('bあb', 'b', 6), -1, 'Searching after end should trigger -1')
  t.equal(sizeBeforeFirst('bあb', 'c'), -1, 'Searching for text that shouldnt exist should trigger -1')
  t.end()
})
test('wrapping', function (t) {
  t.equal(wrap('abcd', 2), 'ab\ncd', 'break a long text')
  t.equal(wrap('abcd', 3), 'abc\nd', 'break a long text')
  t.equal(wrap('abcd  ', 4), 'abcd', 'ignore spaces at the end')
  t.equal(wrap('   abcd', 4), 'abcd', 'ignore spaces at the beginning')
  t.equal(wrap('a  d', 4), 'a  d', 'keep spaces inbetween')
  t.equal(wrap('a bcd', 2), 'a\nbc\nd', 'break a long work')
  t.equal(wrap('あbcd', 2), 'あ\nbc\nd', 'break double width characters')
  t.equal(wrap('あいうえお', 4), 'あい\nうえ\nお', 'break double width characters properly')
  t.equal(wrap('あいうえお', 3), 'あ\nい\nう\nえ\nお', 'break double width characters properly　width uneven breaks')
  t.equal(wrap('あaいiうuえeおo', 4), 'あa\nいi\nうu\nえe\nおo', 'break double width characters properly　width uneven breaks')
  t.equal(wrap('xxxあaい\niあいうえおsssxx\nあいうえお\nalemangeうuえeおoyyy', 5),
    'xxxあ\naい\niあい\nうえ\nおsss\nxx\nあい\nうえ\nお\nalema\nngeう\nuえe\nおoyy\ny',
    'break double width characters properly　width uneven breaks')
  t.equal(wrap('ab\ncd', 5), 'ab cd', 'combine multiple lines but still count linebreak as space')
  t.equal(wrap('ab\ncd', 4), 'ab\ncd', 'or just maintain a good space flow')
  t.equal(wrap('ab\n   cd', 5), 'ab cd', 'ignore spaces at the beginning of a line')
  t.equal(wrap('ab\n   cd\n  e\n f', 5), 'ab cd\ne f', 'ignore spaces at the beginning of multiple line')
  t.equal(wrap('ab \ncd', 4), 'ab\ncd', 'ignore spaces at the end of a line')
  t.equal(wrap('ab \nc d', 5), 'ab c\nd', 'ignore space at the end of a line and still combine with the next')
  t.equal(wrap('mnop abcd', 4), 'mnop\nabcd', 'space directly at line break')
  t.equal(wrap('abcdefghijklmno', 4), 'abcd\nefgh\nijkl\nmno', 'multiple breaks in one line')
  t.equal(wrap('mnopq abcde', 4), 'mnop\nq\nabcd\ne', 'space within multiple breaks')
  t.equal(wrap('mnopq\nabcde', 4), 'mnop\nq\nabcd\ne', 'break within multiple breaks')
  t.equal(wrap('abcdefg\nhijklmno', 4), 'abcd\nefg\nhijk\nlmno', 'Sudden breaks in long text should work too')
  t.equal(wrap(' abcdefg de\nfgh ijklmnop\nqr st uv', 5), 'abcde\nfg de\nfgh\nijklm\nnop\nqr st\nuv', 'various linebreak and space combinations')
  t.end()
})

test('truncate', function (t) {
  t.equals(truncate('DOUTOR あいうえおかきく', 15, '...'), 'DOUTOR あい...')
  t.equals(truncate('けこさし すせそはひふへ', 20, '...'), 'けこさし すせそは...')
  t.equals(truncate('VILLAGE VANGUARD あいうえお', 15, '...'), 'VILLAGE VANG...')
  t.equals(truncate('VILLAGE VANGUARD あいうえお', 15, '...').length, 15)
  t.equals(truncate('Shinjuku', 15, '…'), 'Shinjuku')
  t.equals(truncate('あいうえお', 12, '...'), 'あいうえお', 'Too long even for double width 1')
  t.equals(truncate('あいうえお', 11, '...'), 'あいうえお', 'Too long even for double width 2')
  t.equals(truncate('あいうえお', 10, '...'), 'あいうえお', 'Too long even for double width 3')
  t.equals(truncate('あいうえお', 9, '...'), 'あいう...', 'Just about too short with double width')
  t.equals(truncate('あいうえお', 8, '...'), 'あい...', 'Too short with double width 1')
  t.equals(truncate('あいうえお', 7, '...'), 'あい...', 'Too short with double width 2')
  t.equals(truncate('あいうえお', 6, '...'), 'あ...', 'Too short with double width 3')
  t.equals(truncate('あいうえお', 5, '…'), 'あ…', 'Double width suffix on double width characters')
  t.equals(truncate('あいうえお', 5, str('…', vars)), 'あ…', 'Use a VarSizeString as suffix')
  t.end()
})
