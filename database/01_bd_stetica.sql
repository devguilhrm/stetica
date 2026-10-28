SET NAMES utf8mb4;
-- Stetica: modelo baseado nas entidades da atividade, com extensões documentadas.
-- Destino: MySQL Server 8.0 / 8.4, InnoDB. Execute no MySQL Workbench.
-- Não apaga dados. IF NOT EXISTS não migra uma versão anterior do modelo.
CREATE DATABASE IF NOT EXISTS bd_stetica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bd_stetica;
CREATE TABLE IF NOT EXISTS pessoa (
 idpessoa INT AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(100) NOT NULL, cpf CHAR(11) NOT NULL UNIQUE,
 data_nascimento DATE NOT NULL, sexo CHAR(1) NOT NULL,
 email VARCHAR(100) NOT NULL UNIQUE, telefone VARCHAR(11) NOT NULL,
 ativo BOOLEAN NOT NULL DEFAULT TRUE, senha_hash VARCHAR(200) NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS endereco (
 idendereco INT AUTO_INCREMENT PRIMARY KEY, idpessoa INT NOT NULL UNIQUE,
 cep CHAR(8) NOT NULL, logradouro VARCHAR(150) NOT NULL, bairro VARCHAR(100) NOT NULL,
 cidade VARCHAR(100) NOT NULL, uf CHAR(2) NOT NULL, numero VARCHAR(10) NOT NULL,
 complemento VARCHAR(150) NOT NULL DEFAULT '',
 FOREIGN KEY(idpessoa) REFERENCES pessoa(idpessoa)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS funcionario (
 idpessoa INT PRIMARY KEY, cargo VARCHAR(50) NOT NULL, data_admissao DATE NOT NULL,
 FOREIGN KEY(idpessoa) REFERENCES pessoa(idpessoa)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS categoria (idcategoria INT AUTO_INCREMENT PRIMARY KEY, categoria VARCHAR(35) NOT NULL UNIQUE) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS item (
 iditem INT AUTO_INCREMENT PRIMARY KEY, idcategoria INT NOT NULL,
 item VARCHAR(40) NOT NULL, descricao_item VARCHAR(200) NOT NULL,
 preco DECIMAL(10,2) NOT NULL, tipo_item CHAR(1) NOT NULL, ativo BOOLEAN NOT NULL DEFAULT TRUE,
 FOREIGN KEY(idcategoria) REFERENCES categoria(idcategoria)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS produto (
 iditem INT PRIMARY KEY, codigo_preco INT NOT NULL, preco_venda DECIMAL(10,2) NOT NULL,
 unidade VARCHAR(10) NOT NULL, FOREIGN KEY(iditem) REFERENCES item(iditem)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS estoque (
 iditem INT PRIMARY KEY, quantidade_estoque INT NOT NULL DEFAULT 0,
 FOREIGN KEY(iditem) REFERENCES produto(iditem)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS entrada_produto (
 identrada_produto INT AUTO_INCREMENT PRIMARY KEY, iditem INT NOT NULL,
 data_entrada_produto DATE NOT NULL, quantidade_entrada INT NOT NULL,
 valor_unitario_entrada DECIMAL(10,2) NOT NULL,
 FOREIGN KEY(iditem) REFERENCES estoque(iditem)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS atendimento (
 idatendimento INT AUTO_INCREMENT PRIMARY KEY, idpessoa INT NOT NULL,
 data_atendimento DATETIME NOT NULL, status_atendimento VARCHAR(20) NOT NULL,
 total DECIMAL(10,2) NOT NULL DEFAULT 0,
 FOREIGN KEY(idpessoa) REFERENCES pessoa(idpessoa)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS atendimentoitem (
 idatendimento INT NOT NULL, iditem INT NOT NULL, idfuncionario INT NOT NULL,
 quantidade_itens INT NOT NULL, valor_unitario DECIMAL(10,2) NOT NULL,
 PRIMARY KEY(idatendimento,iditem),
 FOREIGN KEY(idatendimento) REFERENCES atendimento(idatendimento),
 FOREIGN KEY(iditem) REFERENCES item(iditem),
 FOREIGN KEY(idfuncionario) REFERENCES funcionario(idpessoa)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS sessao_cliente (
 id INT AUTO_INCREMENT PRIMARY KEY, idpessoa INT NOT NULL,
 token_hash CHAR(64) NOT NULL UNIQUE, expira_em DATETIME NOT NULL,
 FOREIGN KEY(idpessoa) REFERENCES pessoa(idpessoa)
) ENGINE=InnoDB;

DROP TRIGGER IF EXISTS tr_produto_estoque;
DROP TRIGGER IF EXISTS tr_entrada_produto;
DROP TRIGGER IF EXISTS tr_debito_estoque_atendimento_item;
DROP FUNCTION IF EXISTS fn_calc_preco_venda;
DELIMITER $$
CREATE FUNCTION fn_calc_preco_venda(codigo INT, custo DECIMAL(10,2))
RETURNS DECIMAL(10,2) DETERMINISTIC NO SQL
BEGIN
 RETURN ROUND(custo * CASE codigo WHEN 1 THEN 1.04 WHEN 2 THEN 1.08 WHEN 3 THEN 1.10 ELSE 1 END, 2);
END$$
CREATE TRIGGER tr_produto_estoque AFTER INSERT ON produto FOR EACH ROW
BEGIN
 INSERT INTO estoque(iditem,quantidade_estoque) VALUES(NEW.iditem,0);
END$$
CREATE TRIGGER tr_entrada_produto AFTER INSERT ON entrada_produto FOR EACH ROW
BEGIN
 IF NEW.quantidade_entrada <= 0 OR NEW.valor_unitario_entrada <= 0 THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Quantidade e custo devem ser positivos';
 END IF;
 UPDATE estoque SET quantidade_estoque=quantidade_estoque+NEW.quantidade_entrada WHERE iditem=NEW.iditem;
 UPDATE item SET preco=NEW.valor_unitario_entrada WHERE iditem=NEW.iditem;
 UPDATE produto SET preco_venda=fn_calc_preco_venda(codigo_preco,NEW.valor_unitario_entrada) WHERE iditem=NEW.iditem;
END$$
CREATE TRIGGER tr_debito_estoque_atendimento_item BEFORE INSERT ON atendimentoitem FOR EACH ROW
BEGIN
 DECLARE tipo CHAR(1);
 DECLARE disponivel BOOLEAN;
 IF NEW.quantidade_itens <= 0 OR NEW.valor_unitario < 0 THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Quantidade ou valor inválido';
 END IF;
 SELECT tipo_item,ativo INTO tipo,disponivel FROM item WHERE iditem=NEW.iditem FOR UPDATE;
 IF disponivel IS NULL OR disponivel=FALSE THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Item indisponível';
 END IF;
 IF tipo='P' THEN
  UPDATE estoque SET quantidade_estoque=quantidade_estoque-NEW.quantidade_itens
   WHERE iditem=NEW.iditem AND quantidade_estoque>=NEW.quantidade_itens;
  IF ROW_COUNT()<>1 THEN
   SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Estoque insuficiente';
  END IF;
 ELSEIF NEW.quantidade_itens<>1 THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Serviço deve ter quantidade 1';
 END IF;
END$$
DELIMITER ;

-- Consultas reutilizáveis; a API aplica autorização e filtros de propriedade.
CREATE OR REPLACE VIEW vw_produto_categoria AS
SELECT i.iditem,i.item,i.descricao_item,i.preco,p.preco_venda,p.unidade,c.categoria,e.quantidade_estoque,i.ativo
FROM item i JOIN produto p ON p.iditem=i.iditem JOIN categoria c ON c.idcategoria=i.idcategoria JOIN estoque e ON e.iditem=i.iditem;
CREATE OR REPLACE VIEW vw_servico_categoria AS
SELECT i.*,c.categoria FROM item i JOIN categoria c ON c.idcategoria=i.idcategoria WHERE i.tipo_item='S';
CREATE OR REPLACE VIEW vw_pessoa_endereco AS
SELECT p.idpessoa,p.nome,p.cpf,p.email,p.telefone,e.cep,e.logradouro,e.numero,e.cidade,e.uf
FROM pessoa p JOIN endereco e ON e.idpessoa=p.idpessoa;
CREATE OR REPLACE VIEW vw_funcionario_endereco AS
SELECT v.*,f.cargo,f.data_admissao FROM vw_pessoa_endereco v JOIN funcionario f ON f.idpessoa=v.idpessoa;
CREATE OR REPLACE VIEW vw_atendimento AS
SELECT a.*,p.nome AS cliente FROM atendimento a JOIN pessoa p ON p.idpessoa=a.idpessoa;

DROP PROCEDURE IF EXISTS sp_estoque_por_item;
DELIMITER $$
CREATE PROCEDURE sp_estoque_por_item(IN produto_id INT)
BEGIN
 SELECT * FROM vw_produto_categoria WHERE iditem=produto_id;
END$$
DELIMITER ;
