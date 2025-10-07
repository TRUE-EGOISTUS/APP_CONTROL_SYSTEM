<template>
  <div class="container mt-5">
    <h2>Проекты</h2>

    <button class="btn btn-primary mb-4" @click="testClick('add')">Добавить проект</button>

    <div v-if="projects.length > 0" class="mb-4">
      <button class="btn btn-info me-2" @click="exportProjects('csv')">Экспорт проектов в CSV</button>
      <button class="btn btn-info" @click="exportProjects('excel')">Экспорт проектов в Excel</button>
    </div>

    <h3>Список проектов</h3>
    <div v-if="projects.length > 0">
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Название</th>
            <th>Описание</th>
            <th>Статус</th>
            <th>Дата создания</th>
            <th>Дата закрытия</th>
            <th>Создатель</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="project in projects" :key="project.id" :class="{ 'my-project': project.userId === currentUser?.id }">
            <td>{{ project.name }} <span v-if="project.userId === currentUser?.id" class="badge bg-success ms-2">Мой</span></td>
            <td>{{ project.description || '-' }}</td>
            <td>{{ project.status }}</td>
            <td>{{ new Date(project.createdAt).toLocaleDateString() }}</td>
            <td>{{ project.closedAt ? new Date(project.closedAt).toLocaleDateString() : '-' }}</td>
            <td>{{ project.createdBy || '-' }}</td>
            <td>
              <button class="btn btn-sm btn-primary me-2" @click="goToDefects(project.id)">Просмотреть дефекты</button>
              <button class="btn btn-sm btn-warning me-2" @click="startEditProject(project)" :disabled="project.userId !== currentUser?.id">Редактировать</button>
              <button class="btn btn-sm btn-danger" @click="deleteProject(project.id)" :disabled="project.userId !== currentUser?.id">Удалить</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      <p>Нет проектов.</p>
    </div>

    <ModalForm
      :title="isEditing ? 'Редактировать проект' : 'Добавить проект'"
      :value="showModal"
      @update:value="showModal = $event"
      :isProject="true"
      :users="users"
      :onSubmit="handleSubmit"
      :initialData="editingProject ? { ...editingProject, closedAt: editingProject.closedAt ? new Date(editingProject.closedAt).toISOString().split('T')[0] : '' } : null"
    />
  </div>
</template>

<script>
import axios from 'axios';
import ModalForm from '@/components/ModalForm.vue';

export default {
  components: { ModalForm },
  data() {
    return {
      showModal: false,
      isEditing: false,
      editingProject: null,
      projects: [],
      users: [],
      currentUser: null // Добавляем для хранения текущего пользователя
    };
  },
  methods: {
    testClick(action) {
      this.showModal = true;
      this.isEditing = action === 'edit';
    },
    startEditProject(project) {
      this.editingProject = { ...project };
      this.testClick('edit');
    },
    async createProject(data) {
      try {
        const response = await axios.post('http://localhost:3000/api/projects', {
          name: data.name,
          description: data.description,
          status: data.status
        }, { withCredentials: true });
        alert(`Проект создан: ${response.data.message}`);
        this.fetchProjects();
      } catch (error) {
        alert(`Ошибка создания проекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async updateProject(data) {
      try {
        const response = await axios.put(`http://localhost:3000/api/projects/${this.editingProject.id}`, {
          name: data.name,
          description: data.description,
          status: data.status,
          closedAt: data.closedAt ? new Date(data.closedAt).getTime() : null
        }, { withCredentials: true });
        alert(`Проект обновлён: ${response.data.message}`);
        this.editingProject = null;
        this.fetchProjects();
      } catch (error) {
        alert(`Ошибка обновления проекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async deleteProject(projectId) {
      if (!confirm('Вы уверены, что хотите удалить проект?')) return;
      try {
        const response = await axios.delete(`http://localhost:3000/api/projects/${projectId}`, { withCredentials: true });
        alert(`Проект удалён: ${response.data.message}`);
        this.fetchProjects();
      } catch (error) {
        alert(`Ошибка удаления проекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async exportProjects(format) {
      try {
        const response = await axios.get(`http://localhost:3000/api/export/projects?format=${format}`, {
          withCredentials: true,
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `projects.${format === 'csv' ? 'csv' : 'xlsx'}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        alert(`Ошибка экспорта проектов: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
 async fetchProjects() {
  try {
    const response = await axios.get('http://localhost:3000/api/projects', { withCredentials: true });
    console.log('Данные проектов:', response.data); // Логируем ответ сервера
    this.projects = response.data.projects;
  } catch (error) {
    console.error('Ошибка загрузки проектов:', error.response); // Логируем полную ошибку
    alert(`Ошибка загрузки проектов: ${error.response?.data?.message || 'Ошибка сервера'}`);
    this.$router.push('/login');
  }
},
    async fetchUsers() {
      try {
        const response = await axios.get('http://localhost:3000/api/users', { withCredentials: true });
        this.users = response.data.users;
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
      }
    },
    async fetchProfile() {
      try {
        const response = await axios.get('http://localhost:3000/api/profile', { withCredentials: true });
        this.currentUser = response.data.user;
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        this.$router.push('/login');
      }
    },
    goToDefects(projectId) {
      this.$router.push(`/defects/${projectId}`);
    },
    handleSubmit(data) {
      if (this.isEditing) {
        this.updateProject(data);
      } else {
        this.createProject(data);
      }
      this.showModal = false;
      this.isEditing = false;
      this.editingProject = null;
    }
  },
  mounted() {
    this.fetchProfile(); // Загружаем профиль текущего пользователя
    this.fetchProjects();
    this.fetchUsers();
  }
};
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: auto;
}
.table {
  margin-top: 20px;
}
.my-project {
  font-weight: bold;
}
</style>