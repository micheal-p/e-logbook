<script setup lang="ts"></script>

<template>
  <div>
    <h1 class="mb-1 text-2xl font-bold text-caleb-text">My Students</h1>
    <p class="mb-6 text-sm text-gray-500">Read each student's logbook, comment, approve, and grade.</p>
    <AssignedStudents column="supervisor_id" base-path="/supervisor" />
  </div>
</template>
