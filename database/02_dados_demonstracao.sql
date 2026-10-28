SET NAMES utf8mb4;
-- OPCIONAL: dados fictícios para explorar o sistema. Executar depois do script 01.
-- Conta FICTÍCIA de cliente: cliente.demo@stetica.example / SteticaDemo@123
-- Senha pública somente para demonstração local. Não cria acesso administrativo.
-- Pode ser executado novamente; não sobrescreve contas existentes.
USE bd_stetica;
START TRANSACTION;
INSERT INTO categoria(categoria) SELECT 'Cuidados faciais' WHERE NOT EXISTS(SELECT 1 FROM categoria WHERE categoria='Cuidados faciais');
INSERT INTO categoria(categoria) SELECT 'Bem-estar' WHERE NOT EXISTS(SELECT 1 FROM categoria WHERE categoria='Bem-estar');
INSERT INTO pessoa(nome,cpf,data_nascimento,sexo,email,telefone,ativo)
 SELECT 'Profissional Demonstração','00000000000','1990-01-01','O','equipe@stetica.example','11999999999',TRUE
 WHERE NOT EXISTS(SELECT 1 FROM pessoa WHERE cpf='00000000000');
SET @equipe=(SELECT idpessoa FROM pessoa WHERE cpf='00000000000');
INSERT INTO funcionario(idpessoa,cargo,data_admissao)
 SELECT @equipe,'Esteticista','2024-01-01' WHERE NOT EXISTS(SELECT 1 FROM funcionario WHERE idpessoa=@equipe);
INSERT INTO endereco(idpessoa,cep,logradouro,bairro,cidade,uf,numero,complemento)
 SELECT @equipe,'01001000','Rua de demonstração','Centro','São Paulo','SP','100',''
 WHERE NOT EXISTS(SELECT 1 FROM endereco WHERE idpessoa=@equipe);
SET @facial=(SELECT idcategoria FROM categoria WHERE categoria='Cuidados faciais');
SET @bem=(SELECT idcategoria FROM categoria WHERE categoria='Bem-estar');
INSERT INTO item(idcategoria,item,descricao_item,preco,tipo_item,ativo)
 SELECT @facial,'Sérum facial essencial','Um cuidado diário para sua rotina de beleza.',50.00,'P',TRUE
 WHERE NOT EXISTS(SELECT 1 FROM item WHERE item='Sérum facial essencial');
SET @serum=(SELECT MIN(iditem) FROM item WHERE item='Sérum facial essencial');
INSERT INTO produto(iditem,codigo_preco,preco_venda,unidade)
 SELECT @serum,2,fn_calc_preco_venda(2,50.00),'UN' WHERE NOT EXISTS(SELECT 1 FROM produto WHERE iditem=@serum);
INSERT INTO entrada_produto(iditem,data_entrada_produto,quantidade_entrada,valor_unitario_entrada)
 SELECT @serum,CURRENT_DATE,10,50.00 WHERE NOT EXISTS(SELECT 1 FROM entrada_produto WHERE iditem=@serum);
INSERT INTO item(idcategoria,item,descricao_item,preco,tipo_item,ativo)
 SELECT @bem,'Massagem relaxante','Uma pausa para aliviar tensões e renovar a energia.',120.00,'S',TRUE
 WHERE NOT EXISTS(SELECT 1 FROM item WHERE item='Massagem relaxante');
INSERT INTO item(idcategoria,item,descricao_item,preco,tipo_item,ativo)
 SELECT @facial,'Limpeza de pele','Uma experiência de cuidado e renovação para o rosto.',90.00,'S',TRUE
 WHERE NOT EXISTS(SELECT 1 FROM item WHERE item='Limpeza de pele');

-- Cliente de demonstração para login no Swagger, Insomnia e Angular.
INSERT INTO pessoa(nome,cpf,data_nascimento,sexo,email,telefone,ativo,senha_hash)
 SELECT 'Cliente Demonstração','11144477735','1995-06-15','O','cliente.demo@stetica.example','11988887777',TRUE,'c3RldGljYS1kZW1vLXYxISE=:JF2RXxYHbjMoM3xx7PTdRDdZ0OSHaqXNHzXG3tg0AV8='
 WHERE NOT EXISTS(SELECT 1 FROM pessoa WHERE email='cliente.demo@stetica.example' OR cpf='11144477735');
SET @cliente_demo=(SELECT idpessoa FROM pessoa WHERE email='cliente.demo@stetica.example');
INSERT INTO endereco(idpessoa,cep,logradouro,bairro,cidade,uf,numero,complemento)
 SELECT @cliente_demo,'01001000','Rua Fictícia','Centro','São Paulo','SP','200','Demonstração'
 WHERE @cliente_demo IS NOT NULL AND NOT EXISTS(SELECT 1 FROM endereco WHERE idpessoa=@cliente_demo);
COMMIT;

-- IDs reais para montar requisições; não presuma que os IDs começam em 1.
SELECT idpessoa,nome,email FROM pessoa WHERE email IN ('cliente.demo@stetica.example','equipe@stetica.example');
SELECT idcategoria,categoria FROM categoria WHERE categoria IN ('Cuidados faciais','Bem-estar');
SELECT iditem,item,tipo_item FROM item WHERE item IN ('Sérum facial essencial','Massagem relaxante','Limpeza de pele');
