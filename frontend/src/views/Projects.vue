```vue
<template>
  <div class="container mt-5">
    <h2>Проекты</h2>

    <!-- Форма создания проекта -->
    <h3>Создать проект</h3>
    <form @submit.prevent="createProject">
      <div class="mb-3">
        <label for="projectName" class="form-label">Название проекта</label>
        <input
          type="text"
          class="form-control"
          id="projectName"
          v-model.trim="projectName"
          placeholder="Введите название проекта"
          required
        />
      </div>
      <div class="mb-3">
        <label for="projectDescription" class="form-label">Описание проекта</label>
        <textarea
          class="form-control"
          id="projectDescription"
          v-model.trim="projectDescription"
          placeholder="Введите описание проекта (опционально)"
        ></textarea>
      </div>
      <div class="mb-3">
        <label for="projectStatus" class="form-label">Статус</label>
        <select
          class="form-control"
          id="projectStatus"
          v-model="projectStatus"
          required
        >
          <option value="open">Открыт</option>
          <option value="in progress">В процессе</option>
          <option value="closed">Закрыт</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary mb-4">Создать проект</button>
    </form>

    <!-- Форма редактирования проекта -->
    <div v-if="editingProject">
      <h3>Редактировать проект #{{ editingProject.id }}</h3>
      <form @submit.prevent="updateProject">
        <div class="mb-3">
          <label for="editProjectName" class="form-label">Название проекта</label>
          <input
            type="text"
            class="form-control"
            id="editProjectName"
            v-model.trim="editProjectName"
            placeholder="Введите название проекта"
            required
          />
        </div>
        <div class="mb-3">
          <label for="editProjectDescription" class="form-label">Описание проекта</label>
          <textarea
            class="form-control"
            id="editProjectDescription"
            v-model.trim="editProjectDescription"
            placeholder="Введите описание проекта (опционально)"
          ></textarea>
        </div>
        <div class="mb-3">
          <label for="editProjectStatus" class="form-label">Статус</label>
          <select
            class="form-control"
            id="editProjectStatus"
            v-model="editProjectStatus"
            required
          >
            <option value="open">Открыт</option>
            <option value="in progress">В процессе</option>
            <option value="closed">Закрыт</option>
          </select>
        </div>
        <div class="mb-3">
          <label for="editClosedAt" class="form-label">Дата закрытия</label>
          <input
            type="date"
            class="form-control"
            id="editClosedAt"
            v-model="editClosedAt"
          />
        </div>
        <button type="submit" class="btn btn-success mb-4">Сохранить</button>
        <button type="button" class="btn btn-secondary mb-4 ms-2" @click="cancelEditProject">Отмена</button>
      </form>
    </div>

    <!-- Кнопки экспорта проектов -->
    <div v-if="projects.length > 0" class="mb-4">
      <button class="btn btn-info me-2" @click="exportProjects('csv')">Экспорт проектов в CSV</button>
      <button class="btn btn-info" @click="exportProjects('excel')">Экспорт проектов в Excel</button>
    </div>

    <!-- Список проектов -->
    <h3>Ваши проекты</h3>
    <div v-if="projects.length > 0">
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Название</th>
            <th>Описание</th>
            <th>Статус</th>
            <th>Создан</th>
            <th>Закрыт</th>
            <th>Создал</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="project in projects" :key="project.id">
            <td>{{ project.name }}</td>
            <td>{{ project.description || '-' }}</td>
            <td>{{ project.status }}</td>
            <td>{{ new Date(project.createdAt).toLocaleDateString() }}</td>
            <td>{{ project.closedAt ? new Date(project.closedAt).toLocaleDateString() : '-' }}</td>
            <td>{{ project.createdBy || '-' }}</td>
            <td>
              <button class="btn btn-sm btn-primary me-2" @click="goToDefects(project.id)">Просмотреть дефекты</button>
              <button class="btn btn-sm btn-warning me-2" @click="startEditProject(project)">Редактировать</button>
              <button class="btn btn-sm btn-danger" @click="deleteProject(project.id)">Удалить</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      <p>У вас пока нет проектов.</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Projects',
  data() {
    return {
      projectName: '',
      projectDescription: '',
      projectStatus: 'open',
      editProjectName: '',
      editProjectDescription: '',
      editProjectStatus: 'open',
      editClosedAt: '',
      editingProject: null,
      projects: [],
      users: []
    };
  },
  methods: {
    async createProject() {
      try {
        const response = await axios.post('http://localhost:3000/api/projects', {
          name: this.projectName,
          description: this.projectDescription,
          status: this.projectStatus
        }, { withCredentials: true });
        alert(`Проект создан: ${response.data.message}`);
        this.projectName = '';
        this.projectDescription = '';
        this.projectStatus = 'open';
        this.fetchProjects();
      } catch (error) {
        alert(`Ошибка создания проекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async fetchProjects() {
      try {
        const response = await axios.get('http://localhost:3000/api/projects', { withCredentials: true });
        this.projects = response.data.projects.map(project => ({
          ...project,
          createdBy: response.data.users.find(user => user.id === project.userId)?.email || 'Неизвестно'
        }));
      } catch (error) {
        alert(`Ошибка загрузки проектов: ${error.response?.data?.message || 'Ошибка сервера'}`);
        this.$router.push('/login');
      }
    },
    startEditProject(project) {
      this.editingProject = project;
      this.editProjectName = project.name;
      this.editProjectDescription = project.description || '';
      this.editProjectStatus = project.status;
      this.editClosedAt = project.closedAt ? new Date(project.closedAt).toISOString().split('T')[0] : '';
    },
    async updateProject() {
      try {
        const response = await axios.put(`http://localhost:3000/api/projects/${this.editingProject.id}`, {
          name: this.editProjectName,
          description: this.editProjectDescription,
          status: this.editProjectStatus,
          closedAt: this.editClosedAt ? new Date(this.editClosedAt).getTime() : null
        }, { withCredentials: true });
        alert(`Проект обновлён: ${response.data.message}`);
        this.editingProject = null;
        this.editProjectName = '';
        this.editProjectDescription = '';
        this.editProjectStatus = 'open';
        this.editClosedAt = '';
        this.fetchProjects();
      } catch (error) {
        alert(`Ошибка обновления проекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    cancelEditProject() {
      this.editingProject = null;
      this.editProjectName = '';
      this.editProjectDescription = '';
      this.editProjectStatus = 'open';
      this.editClosedAt = '';
    },
    async deleteProject(projectId) {
      if (!confirm('Вы уверены, что хотите удалить проект? Все связанные дефекты будут удалены.')) {
        return;
      }
      try {
        const response = await axios.delete(`http://localhost:3000/api/projects/${projectId}`, { withCredentials: true });
        alert(`Проект удалён: ${response.data.message}`);
        this.fetchProjects();
      } catch (error) {
        alert(`Ошибка удаления проекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    goToDefects(projectId) {
      this.$router.push({ path: `/defects/${projectId}` });
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
    async fetchUsers() {
      try {
        const response = await axios.get('http://localhost:3000/api/users', { withCredentials: true });
        this.users = response.data.users;
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
      }
    }
  },
  mounted() {
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
</style>
```