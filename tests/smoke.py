"""Integração real com a API/MySQL. Cria dados identificados por execução; não apaga dados.
STETICA_TEST_ADMIN_KEY deve conter a chave do ambiente local de teste.
Execute somente em banco de desenvolvimento. Python 3.9+; sem pacotes extras.
"""
import concurrent.futures
import datetime
import json
import os
import secrets
import urllib.error
import urllib.request

BASE = os.environ.get('STETICA_TEST_URL', 'http://localhost:5080/api').rstrip('/')
KEY = os.environ['STETICA_TEST_ADMIN_KEY']
RUN = secrets.token_hex(4)
COUNT = 0


def req(method, path, data=None, *, token=None, admin=False, expect=200):
    global COUNT
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    if admin:
        headers['X-Admin-Key'] = KEY
    request = urllib.request.Request(BASE + '/' + path, data=None if data is None else json.dumps(data).encode(), headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            code, body = response.status, response.read()
    except urllib.error.HTTPError as error:
        code, body = error.code, error.read()
    assert code == expect, (method, path, code, body.decode()[:500], 'esperado', expect)
    COUNT += 1
    return json.loads(body) if body else None


def person(suffix):
    return {'nome': 'Teste ' + RUN + suffix, 'cpf': ''.join(str(secrets.randbelow(10)) for _ in range(11)),
            'dataNascimento': '1998-02-15', 'sexo': 'O', 'email': RUN + suffix + '@stetica.test',
            'telefone': '11912345678', 'endereco': {'cep': '01001000', 'logradouro': 'Rua Teste', 'bairro': 'Centro',
            'cidade': 'São Paulo', 'uf': 'SP', 'numero': '10', 'complemento': ''}}


def main():
    req('GET', 'saude')
    req('GET', 'pessoas', expect=401)
    req('GET', 'pedidos', expect=401)
    req('POST', 'clientes', {}, expect=400)
    category = req('POST', 'categorias', {'nome': 'Teste ' + RUN}, admin=True, expect=201)['id']
    req('GET', f'categorias/{category}')
    employee = person('f')
    employee.update(cargo='Esteticista', dataAdmissao='2024-01-01')
    staff = req('POST', 'funcionarios', employee, admin=True, expect=201)['id']
    customer = person('a')
    customer['senha'] = secrets.token_urlsafe(20)
    session = req('POST', 'clientes', customer, expect=201)
    token = session['token']
    req('POST', 'clientes', customer, expect=400)
    req('POST', 'sessoes', {'email': customer['email'], 'senha': 'senha errada'}, expect=401)
    logged = req('POST', 'sessoes', {'email': customer['email'], 'senha': customer['senha']})
    other = person('b')
    other['senha'] = secrets.token_urlsafe(20)
    other_token = req('POST', 'clientes', other, expect=201)['token']
    product_data = {'nome': 'Produto ' + RUN, 'descricao': 'Teste de integração', 'tipo': 'P', 'categoriaId': category,
                    'preco': 10, 'codigoPreco': 2, 'unidade': 'UN', 'ativo': True}
    product = req('POST', 'itens', product_data, admin=True, expect=201)['id']
    service_data = {**product_data, 'nome': 'Serviço ' + RUN, 'tipo': 'S', 'preco': 50}
    service = req('POST', 'itens', service_data, admin=True, expect=201)['id']
    req('DELETE', f'categorias/{category}', admin=True, expect=409)
    result = req('GET', 'itens?busca=' + RUN + '&tipo=P&categoriaId=' + str(category))
    assert len(result) == 1 and result[0]['id'] == product
    req('GET', 'itens/2147483647', expect=404)
    req('GET', 'estoque/2147483647', admin=True, expect=404)
    req('GET', f'estoque/{service}', admin=True, expect=404)
    assert req('GET', f'estoque/{product}', admin=True)['quantidade'] == 0
    entry = {'produtoId': product, 'data': datetime.date.today().isoformat(), 'quantidade': 5, 'valorUnitario': 20}
    req('POST', 'entradaprodutos', entry, admin=True, expect=201)
    assert req('GET', f'estoque/{product}', admin=True)['quantidade'] == 5
    assert req('GET', f'itens/{product}')['preco'] == 21.6
    def order(qty, item=product):
        return {'itens': [{'itemId': item, 'quantidade': qty, 'funcionarioId': staff}]}
    req('POST', 'pedidos', order(6), token=token, expect=409)
    assert req('GET', 'meus-pedidos', token=token) == []
    pedido = req('POST', 'pedidos', {'itens': order(2)['itens'] + order(1, service)['itens']}, token=token, expect=201)
    assert abs(pedido['total'] - 93.2) < .001
    assert req('GET', f'estoque/{product}', admin=True)['quantidade'] == 3
    req('GET', f'meus-pedidos/{pedido["id"]}', token=other_token, expect=404)
    req('GET', f'meus-pedidos/{pedido["id"]}', expect=401)
    assert len(req('GET', 'meus-pedidos', token=logged['token'])) == 1
    req('PUT', f'pedidos/{pedido["id"]}/status', {'status': 'Concluído'}, admin=True, expect=409)
    req('PUT', f'pedidos/{pedido["id"]}/status', {'status': 'Cancelado'}, admin=True, expect=204)
    assert req('GET', f'estoque/{product}', admin=True)['quantidade'] == 5
    req('PUT', f'pedidos/{pedido["id"]}/status', {'status': 'Cancelado'}, admin=True, expect=409)
    assert req('GET', f'estoque/{product}', admin=True)['quantidade'] == 5
    # Duas compras disputam cinco unidades: só uma compra de cinco pode vencer.
    def concurrent_order(_):
        try:
            req('POST', 'pedidos', order(5), token=token, expect=201)
            return True
        except AssertionError as e:
            assert e.args[0][2] == 409, e
            return False
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        assert sum(pool.map(concurrent_order, [1, 2])) == 1
    assert req('GET', f'estoque/{product}', admin=True)['quantidade'] == 0
    orders = req('GET', 'meus-pedidos', token=token)
    completed = next(p for p in orders if p['status'] == 'Aberto')
    for status in ['Em processamento', 'Concluído']:
        req('PUT', f'pedidos/{completed["id"]}/status', {'status': status}, admin=True, expect=204)
    req('PUT', f'pedidos/{completed["id"]}/status', {'status': 'Cancelado'}, admin=True, expect=409)
    # Alterar preço do catálogo não modifica valores gravados no pedido.
    req('PUT', f'itens/{product}', {**product_data, 'preco': 99}, admin=True, expect=204)
    assert req('GET', f'meus-pedidos/{completed["id"]}', token=token)['itens'][0]['valorUnitario'] == 21.6
    req('DELETE', f'itens/{product}', admin=True, expect=204)
    req('GET', f'itens/{product}', expect=404)
    req('POST', 'pedidos', order(1), token=token, expect=400)
    req('GET', 'resumo', admin=True)
    req('DELETE', 'sessoes', token=token, expect=204)
    req('GET', 'meus-pedidos', token=token, expect=401)
    print(f'OK: {COUNT} verificações HTTP; estoque, concorrência, preços, validações e isolamento entre clientes. Execução {RUN}.')


if __name__ == '__main__':
    main()
