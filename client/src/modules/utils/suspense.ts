export function createResource<T>(promise: Promise<T>) {
  let status = 'pending';
  let result: Promise<void> | T = promise.then(
    (resolved) => {
      status = 'success';
      result = resolved;
    },
    (rejected) => {
      status = 'error';
      result = rejected;
    }
  );
  return {
    read() {
      if (status === 'pending') throw result;
      if (status === 'error') throw result;
      if (status === 'success') return result as T;
      throw new Error('This should be impossible');
    },
  };
}

// USAGE:

// let pokemonResource = createResource(fetchPokemon('pokemonName'));

// function PokemonInfo() {
//   const pokemon = pokemonResource.read();
//   return (
//     <div>
//       <div className='pokemon-info__img-wrapper'>
//         <img src={pokemon.image} alt={pokemon.name} />
//       </div>
//       <PokemonDataView pokemon={pokemon} />
//     </div>
//   );
// }

// function fetchPokemon(name, delay = 1500) {
//   const endTime = Date.now() + delay;
//   const pokemonQuery = graphql`
//     query PokemonInfo($name: String) {
//       pokemon(name: $name) {
//         id
//         number
//         name
//         image
//         attacks {
//           special {
//             name
//             type
//             damage
//           }
//         }
//       }
//     }
//   `;

//   return window
//     .fetch('https://graphql-pokemon2.vercel.app', {
//       // learn more about this API here: https://graphql-pokemon2.vercel.app
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         query: pokemonQuery,
//         variables: { name: name.toLowerCase() },
//       }),
//     })
//     .then((response) => response.json())
//     .then(async (response) => {
//       await sleep(endTime - Date.now());
//       return response;
//     })
//     .then((response) => {
//       if (response.errors) {
//         return Promise.reject(new Error(response.errors.map((e) => e.message).join('\n')));
//       }
//       const pokemon = response.data.pokemon;
//       if (pokemon) {
//         pokemon.fetchedAt = formatDate(new Date());
//         return pokemon;
//       } else {
//         return Promise.reject(new Error(`No pokemon with the name "${name}"`));
//       }
//     });
// }
