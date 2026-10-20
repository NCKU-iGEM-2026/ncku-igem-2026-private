from os import path
from pathlib import Path

from flask import Flask, abort, render_template
from flask_frozen import Freezer
from jinja2 import TemplateNotFound


template_folder = path.abspath('./wiki')

app = Flask(__name__, template_folder=template_folder)
#app.config['FREEZER_BASE_URL'] = environ.get('CI_PAGES_URL')
app.config['FREEZER_DESTINATION'] = 'public'
app.config['FREEZER_RELATIVE_URLS'] = True
app.config['FREEZER_IGNORE_MIMETYPE_WARNINGS'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
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
    """Render wiki/pages/<page>.html, or 404 when there is no such page.

    Without this guard an unknown URL raises TemplateNotFound and the dev
    server answers 500, which reads as a broken page rather than a missing
    one. The built site simply has no file at that path and the iGEM server
    answers 404, so local preview now behaves the same way.
    """
    template = str(Path('pages')) + '/' + page.lower() + '.html'
    try:
        return render_template(template)
    except TemplateNotFound as missing:
        if missing.name != template:
            raise  # a real page that includes a template we have lost
        abort(404)


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
