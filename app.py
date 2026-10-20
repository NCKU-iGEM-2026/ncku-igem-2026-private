from os import path
from pathlib import Path

from flask import Flask, abort, render_template
from flask_frozen import Freezer
from jinja2 import TemplateNotFound


template_folder = path.abspath('./wiki')

app = Flask(__name__, template_folder=template_folder)
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
    template = str(Path('pages')) + '/' + page.lower() + '.html'
    try:
        return render_template(template)
    except TemplateNotFound as missing:
        if missing.name != template:
            raise
        abort(404)


@freezer.register_generator
def all_wiki_pages():
    for page in sorted(Path(template_folder, 'pages').glob('*.html')):
        if page.stem != 'home':
            yield 'pages', {'page': page.stem}

if __name__ == "__main__":
    app.run(port=8080)
