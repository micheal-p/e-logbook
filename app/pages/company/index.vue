<script setup lang="ts"></script>

<template>
  <div>
    <h1 class="mb-1 text-2xl font-bold text-caleb-text">My Students</h1>
    <p class="mb-6 text-sm text-gray-500">Review and approve your students' daily tasks.</p>
    <AssignedStudents column="company_supervisor_id" base-path="/company" />
  </div>
</template>
