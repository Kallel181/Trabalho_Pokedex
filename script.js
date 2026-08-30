const LIMIT = 30;
let pageIndex = 0; // Índice da página atual (0, 1, 2...)
let filteredList = []; // Lista guardando apenas os Pokémon do tipo selecionado

const GENERATIONS = {
  '1': { offset: 0, limit: 151 },
  '2': { offset: 151, limit: 100 },
  '3': { offset: 251, limit: 135 },
  '4': { offset: 386, limit: 107 },
  '5': { offset: 493, limit: 156 }
};

// Seletores do DOM
const container = document.getElementById('pokemon-container');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const pageInfo = document.getElementById('page-info');

const selectGen = document.getElementById('select-generation');
const selectType = document.getElementById('select-type');

const modal = document.getElementById('modal-details');
const modalBody = document.getElementById('modal-body');
const btnClose = document.getElementById('btn-close');

// 1. Busca a lista da Geração e aplica a filtragem por tipo
function carregarPokemon() {
  container.innerHTML = '';
  pageInfo.textContent = 'Carregando...';

  const genData = GENERATIONS[selectGen.value];
  const url = 'https://pokeapi.co/api/v2/pokemon?limit=' + genData.limit + '&offset=' + genData.offset;

  fetch(url)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      // Busca os detalhes de todos os Pokémon da geração em paralelo
      const promessas = data.results.map(function (pokemon) {
        return fetch(pokemon.url).then(function (res) {
          return res.json();
        });
      });

      return Promise.all(promessas);
    })
    .then(function (pokemons) {
      const selectedType = selectType.value;

      // Filtra os Pokémon pelo tipo selecionado
      if (selectedType === 'all') {
        filteredList = pokemons;
      } else {
        filteredList = pokemons.filter(function (pokemon) {
          return pokemon.types.some(function (t) {
            return t.type.name === selectedType;
          });
        });
      }

      // Renderiza a página
      exibirPaginaAtual();
    })
    .catch(function (error) {
      console.error('Erro ao carregar os Pokémon:', error);
      pageInfo.textContent = 'Erro ao carregar';
    });
}

// 2. Renderiza exatamente até 30 Pokémon por página a partir da lista filtrada
function exibirPaginaAtual() {
  container.innerHTML = '';

  if (filteredList.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Nenhum Pokémon deste tipo encontrado nesta geração.</p>';
    atualizarPaginacao();
    return;
  }

  const inicio = pageIndex * LIMIT;
  const fim = inicio + LIMIT;
  const pokemonsPagina = filteredList.slice(inicio, fim);

  pokemonsPagina.forEach(function (pokemon) {
    criarCardPokemon(pokemon);
  });

  atualizarPaginacao();
}

// 3. Cria os Cards no DOM
function criarCardPokemon(pokemon) {
  const card = document.createElement('div');
  card.className = 'card';

  const imagem = document.createElement('img');
  imagem.className = 'card-img';
  imagem.src = pokemon.sprites.front_default || '';
  imagem.alt = pokemon.name;

  const nome = document.createElement('h2');
  nome.className = 'card-title';
  nome.textContent = pokemon.name;

  const idInfo = document.createElement('p');
  idInfo.className = 'card-info';
  idInfo.textContent = 'Nº ' + pokemon.id;

  const tipoBadge = document.createElement('span');
  tipoBadge.className = 'card-badge';
  tipoBadge.textContent = pokemon.types[0].type.name;

  card.appendChild(imagem);
  card.appendChild(nome);
  card.appendChild(idInfo);
  card.appendChild(tipoBadge);

  card.addEventListener('click', function () {
    exibirDetalhesModal(pokemon);
  });

  container.appendChild(card);
}

// 4. Atualiza os botões de navegação
function atualizarPaginacao() {
  const totalPaginas = Math.ceil(filteredList.length / LIMIT) || 1;
  pageInfo.textContent = 'Página ' + (pageIndex + 1) + ' de ' + totalPaginas;

  btnPrev.disabled = pageIndex === 0;
  btnNext.disabled = (pageIndex + 1) >= totalPaginas;
}

// 5. Janela Modal de Detalhes
function exibirDetalhesModal(pokemon) {
  modalBody.innerHTML = '';

  const img = document.createElement('img');
  img.src = pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default;
  img.className = 'details-img';

  const title = document.createElement('h2');
  title.className = 'card-title';
  title.textContent = pokemon.name + ' (Nº ' + pokemon.id + ')';

  const stats = document.createElement('div');
  stats.className = 'details-stats';
  stats.innerHTML = 
    '<p><strong>Altura:</strong> ' + (pokemon.height / 10) + ' m</p>' +
    '<p><strong>Peso:</strong> ' + (pokemon.weight / 10) + ' kg</p>' +
    '<p><strong>HP:</strong> ' + pokemon.stats[0].base_stat + '</p>' +
    '<p><strong>Ataque:</strong> ' + pokemon.stats[1].base_stat + '</p>' +
    '<p><strong>Defesa:</strong> ' + pokemon.stats[2].base_stat + '</p>' +
    '<p><strong>Velocidade:</strong> ' + pokemon.stats[5].base_stat + '</p>';

  modalBody.appendChild(img);
  modalBody.appendChild(title);
  modalBody.appendChild(stats);

  modal.classList.remove('hidden');
}

// Eventos dos Filtros
selectGen.addEventListener('change', function () {
  pageIndex = 0;
  carregarPokemon();
});

selectType.addEventListener('change', function () {
  pageIndex = 0;
  carregarPokemon();
});

// Eventos de Paginação
btnNext.addEventListener('click', function () {
  pageIndex++;
  exibirPaginaAtual();
});

btnPrev.addEventListener('click', function () {
  if (pageIndex > 0) {
    pageIndex--;
    exibirPaginaAtual();
  }
});

// Eventos de Fechamento da Modal
btnClose.addEventListener('click', function () {
  modal.classList.add('hidden');
});

window.addEventListener('click', function (event) {
  if (event.target === modal) {
    modal.classList.add('hidden');
  }
});

// Inicialização
carregarPokemon();