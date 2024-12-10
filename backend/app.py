from flask import Flask, jsonify
from flask_restful import Resource, Api
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)
api = Api(app)

class Obtener_Predicciones(Resource):
    def get(self, filename):
        try:
            file_path = os.path.join('/Users/eltimo/Documents/Universidad/5toB/PFC3/WebClasificacionExplicatoriaCafe/backend/modelos_ouput', f'{filename}.json')
            if not os.path.isfile(file_path):
                return jsonify({'error': 'Archivo no encontrado'}), 404
            with open(file_path, 'r', encoding='utf-8') as archivo:
                data = json.load(archivo)
            return jsonify(data)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        

class Obtener_Vectores(Resource):
    def get(self, filename):
        try:
            file_path = os.path.join('/Users/eltimo/Documents/Universidad/5toB/PFC3/WebClasificacionExplicatoriaCafe/backend/modelos_ouput', f'{filename}_vectores.json')
            if not os.path.isfile(file_path):
                return jsonify({'error': 'Archivo no encontrado'}), 404
            with open(file_path, 'r', encoding='utf-8') as archivo:
                data = json.load(archivo)
            return jsonify(data)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

api.add_resource(Obtener_Predicciones, '/predicciones/<string:filename>')
api.add_resource(Obtener_Vectores, '/vectores/<string:filename>')

if __name__ == '__main__':
    app.run(port=3000, debug=True)
