let clientes = [];


const tablaClientes = document.getElementById("tablaClientes");
const buscador = document.getElementById("buscarCliente");
const filtroEstado = document.getElementById("filtroEstado");


async function cargarClientes(){


clientes = await window.flowLoadClientes("../Data/clientes.json");


mostrarClientes(clientes);


}



function mostrarClientes(lista){


tablaClientes.innerHTML="";


lista.forEach(cliente=>{


tablaClientes.innerHTML += `

<tr>

<td>${cliente.nombre}</td>

<td>${cliente.edad}</td>

<td>${cliente.peso} kg</td>

<td>${cliente.objetivo}</td>

<td>
<span class="estado">
${cliente.estado}
</span>
</td>

<td><span class="status-badge">${cliente.tipoSeguimiento || "General"}</span></td>

<td>
<div class="client-actions">
<a href="perfil-cliente.html?id=${cliente.id}">Perfil</a>
<a href="editar-cliente.html?id=${cliente.id}">Editar</a>
</div>
</td>

</tr>

`;


});


}



buscador.addEventListener("keyup",()=>{


const texto = buscador.value.toLowerCase();


const resultado = clientes.filter(cliente=>

cliente.nombre.toLowerCase().includes(texto)

);


mostrarClientes(resultado);


});



filtroEstado.addEventListener("change",()=>{


const estado=filtroEstado.value;


if(estado==="Todos"){

mostrarClientes(clientes);

return;

}


mostrarClientes(

clientes.filter(cliente=>

cliente.estado===estado

)

);


});



cargarClientes();


