<template>
    <div id="resultsTable" class="p-2 rounded border mb-5">
        <table class="table mb-0">
            <tbody class="align-middle">
                <slot></slot>
            </tbody>
        </table>
    </div>
</template>
<style>
#resultsTable tbody tr:last-child td,
#resultsTable tbody tr:last-child th {
    border-bottom: 0;
}
</style>
