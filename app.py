from os import path
from pathlib import Path

from flask import Flask, render_template
from flask_frozen import Freezer


template_folder = path.abspath('./wiki')

app = Flask(__name__, template_folder=template_folder)
#app.config['FREEZER_BASE_URL'] = environ.get('CI_PAGES_URL')
app.config['FREEZER_DESTINATION'] = 'public'
app.config['FREEZER_RELATIVE_URLS'] = True
app.config['FREEZER_IGNORE_MIMETYPE_WARNINGS'] = True
freezer = Freezer(app)

@app.cli.command()
def freeze():
    freezer.freeze()

@app.cli.command()
def serve():
    freezer.run()

@app.route('/')
def home():
    return render_template('pages/home.html')

@app.route('/<page>')
def pages(page):
    return render_template(str(Path('pages')) + '/' + page.lower() + '.html')


@freezer.register_generator
def all_wiki_pages():
    """Build every page in wiki/pages, linked from the menu or not.

    Frozen-Flask discovers URLs by following links, so a page that is not in
    the menu is silently left out of the built site even though its source
    file is still here. Listing them explicitly means reorganising the menu
    only moves pages around; it never drops their content from the wiki.
    """
    for page in sorted(Path(template_folder, 'pages').glob('*.html')):
        if page.stem != 'home':
            yield 'pages', {'page': page.stem}

# Main Function, Runs at http://0.0.0.0:8080
if __name__ == "__main__":
    app.run(port=8080)
