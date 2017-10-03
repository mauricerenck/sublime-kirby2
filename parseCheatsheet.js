var casper        = require('casper').create();
var fs            = require('fs');
var baseUrl       = 'https://getkirby.com/docs/cheatsheet';
var kirbyDocLinks = [];

function getLinks() {
	var links = document.querySelectorAll('.cheatsheet-grid-item a');
	return Array.prototype.map.call(links, function(e) {
		return {
			url: e.getAttribute('href')
		};
	});
}

function parseDetailPage() {
	var methodName = document.querySelectorAll('.main h1.alpha')[0].innerHTML;
	var title      = methodName.replace('-&gt;', '->');
	methodName     = methodName.split('-&gt;');
	return {title: title, methodName: methodName};
}

function openDetailPage(url) {
	casper.thenOpen(url, function() {
		var kirbyMethod = this.evaluate(parseDetailPage);
		createSnippet(kirbyMethod.title, kirbyMethod.methodName);
	});
}

function createSnippet(methodTitle, methodName) {

	var snippet    = [];
	var tabCounter = 1;
	var trigger;

	for (var i = 0; i < methodName.length; i++) {
		var brackets = methodName[i].replace('array()', 'array--').match(/\(([^)]+)\)/);
		var methodParam;

		if(brackets !== null) {
			methodParam        = brackets[0].substring(1, (brackets[0].length - 1)).replace(/ \[/g, '').replace(/\[/g, '').replace(/\]/g, '').split(', ');
			var methodOption   = [];
			var optionalParams = brackets[0].match(/\[(.*?)\]/);
			var functionName   = '${' + tabCounter +':' + methodName[i].split('(')[0];
			tabCounter++;

			for (var u = 0; u < methodParam.length; u++) {
				if(brackets[0].indexOf('[, ' + methodParam[u] + ']') !== -1) {
					methodOption.push(methodParam[u].replace('$', '${' + tabCounter + ':\[\\\$') + ']}');
				} else if(brackets[0].indexOf('[' + methodParam[u] + ']') !== -1) {
					methodOption.push(methodParam[u].replace('$', '${' + tabCounter + ':\[\\\$') + ']}');
				} else {
					methodOption.push(methodParam[u].replace('$', '${' + tabCounter + ':\\\$') + '}');
				}
				tabCounter++;
			}
			methodParam = methodOption.join(', ');
			trigger     = methodName[i].split('(')[0].replace('$', '');

			snippet.push(functionName + '(' + methodParam.replace(/array--/g, 'array()') + ')}');
		} else {
			trigger = methodName[i].split('(')[0].replace('$', '');

			snippet.push('${' + tabCounter +':' + methodName[i].replace('\$', '\\\$') + '}');
			tabCounter++;
		}
	}

	var snippetCode =	"<snippet>\n" +
						"<content><![CDATA[\n" +
						snippet.join("->") + "\n" +
						"]]></content>\n" + 
						"<tabTrigger>" + trigger + "</tabTrigger>\n" +
						"<description>Kirby: " + methodTitle + "</description>\n" +
						"<scope>source.php</scope>\n" + 
						"</snippet>";

	saveData(methodName[0].split('(')[0].replace('$', ''), trigger, snippetCode);
}

function saveData(section, trigger, snippetCode) {
	var filePathName = fs.pathJoin(fs.workingDirectory, 'snippets', section + '_' + trigger + '.sublime-snippet');
	fs.write(filePathName, snippetCode, 'w');
}



casper.start(baseUrl, function() {
	this.echo(this.getTitle());

	kirbyDocLinks = this.evaluate(getLinks);

	for (var i = 0; i < kirbyDocLinks.length; i++) {
		if(kirbyDocLinks[i].url.indexOf(baseUrl) !== -1 && kirbyDocLinks[i].url.indexOf('/options/') === -1 && kirbyDocLinks[i].url.indexOf('/panel-fields/') === -1 && kirbyDocLinks[i].url.indexOf('/permissions/') === -1 && kirbyDocLinks[i].url.indexOf('/validators/') === -1 && kirbyDocLinks[i].url.indexOf('/helpers/') === -1 && kirbyDocLinks[i].url.indexOf('/kirbytags/') === -1 && kirbyDocLinks[i].url.indexOf('/site/was-modified-after') === -1) {
			openDetailPage(kirbyDocLinks[i].url);
		}
	}
});


casper.run();
