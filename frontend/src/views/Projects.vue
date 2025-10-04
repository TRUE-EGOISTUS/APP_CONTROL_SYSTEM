<template>
  <div class="container mt-5">
    <h2>Проекты и дефекты</h2>
    <h3>Создать проект</h3>
    <form @submit.prevent="createProject">
      <div class="mb-3">
        <label for="projectName" class="form-label">Название проекта</label>
        <input
          type="text"
          class="form-control"
          :class="{ 'is-invalid': projectNameError }"
          id="projectName"
          v-model.trim="projectName"
          placeholder="Введите название проекта"
          required
        />
        <div v-if="projectNameError" class="invalid-feedback">{{ projectNameError }}</div>
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
      <button type="submit" class="btn btn-primary mb-4">Создать проект</button>
    </form>
    <h3>Ваши проекты</h3>
    <div v-if="projects.length > 0">
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Название</th>
            <th>Описание</th>
            <th>Дата создания</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="project in projects" :key="project.id">
            <td>{{ project.name }}</td>
            <td>{{ project.description || '-' }}</td>
            <td>{{ new Date(project.createdAt).toLocaleDateString() }}</td>
            <td>
              <button class="btn btn-sm btn-primary" @click="selectProject(project.id)">Просмотреть дефекты</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      <p>У вас пока нет проектов.</p>
    </div>
    <div v-if="selectedProjectId !== null">
      <h3>Добавить дефект для проекта #{{ selectedProjectId }}</h3>
      <form @submit.prevent="createDefect">
        <div class="mb-3">
          <label for="defectDescription" class="form-label">Описание дефекта</label>
          <textarea
            class="form-control"
            :class="{ 'is-invalid': defectDescriptionError }"
            id="defectDescription"
            v-model.trim="defectDescription"
            placeholder="Введите описание дефекта"
            required
          ></textarea>
          <div v-if="defectDescriptionError" class="invalid-feedback">{{ defectDescriptionError }}</div>
        </div>
        <div class="mb-3">
          <label for="defectStatus" class="form-label">Статус</label>
          <select
            class="form-control"
            id="defectStatus"
            v-model="defectStatus"
            required
          >
            <option value="open">Открыт</option>
            <option value="closed">Закрыт</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary mb-4">Добавить дефект</button>
      </form>
      <h3>Дефекты проекта #{{ selectedProjectId }}</h3>
      <div v-if="defects.length > 0">
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Описание</th>
              <th>Статус</th>
              <th>Дата создания</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="defect in defects" :key="defect.id">
              <td>{{ defect.description }}</td>
              <td>{{ defect.status === 'open' ? 'Открыт' : 'Закрыт' }}</td>
              <td>{{ new Date(defect.createdAt).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else>
        <p>У проекта пока нет дефектов.</p>
      </div>
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
      projectNameError: '',
      selectedProjectId: null,
      defectDescription: '',
      defectStatus: 'open',
      defectDescriptionError: '',
      projects: [],
      defects: []
    };
  },
  methods: {
    async createProject() {
      this.projectNameError = '';
      if (!this.projectName) {
        this.projectNameError = 'Название проекта обязательно';
        return;
      }

      try {
        const response = await axios.post('http://localhost:3000/api/projects', {
          name: this.projectName,
          description: this.projectDescription
        }, { withCredentials: true });
        alert(`Проект создан: ${response.data.message}`);
        this.projectName = '';
        this.projectDescription = '';
        this.fetchProjects();
      } catch (error) {
        alert(`Ошибка создания проекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async fetchProjects() {
      try {
        const response = await axios.get('http://localhost:3000/api/projects', { withCredentials: true });
        this.projects = response.data.projects;
      } catch (error) {
        alert(`Ошибка загрузки проектов: ${error.response?.data?.message || 'Ошибка сервера'}`);
        this.$router.push('/login');
      }
    },
    async selectProject(projectId) {
      this.selectedProjectId = projectId;
      this.defects = [];
      this.defectDescription = '';
      this.defectStatus = 'open';
      await this.fetchDefects();
    },
    async createDefect() {
      this.defectDescriptionError = '';
      if (!this.defectDescription) {
        this.defectDescriptionError = 'Описание дефекта обязательно';
        return;
      }

      try {
        const response = await axios.post('http://localhost:3000/api/defects', {
          projectId: this.selectedProjectId,
          description: this.defectDescription,
          status: this.defectStatus
        }, { withCredentials: true });
        alert(`Дефект создан: ${response.data.message}`);
        this.defectDescription = '';
        this.defectStatus = 'open';
        this.fetchDefects();
      } catch (error) {
        alert(`Ошибка создания дефекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async fetchDefects() {
      try {
        const response = await axios.get(`http://localhost:3000/api/defects?projectId=${this.selectedProjectId}`, {
          withCredentials: true
        });
        this.defects = response.data.defects;
      } catch (error) {
        alert(`Ошибка загрузки дефектов: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    }
  },
  mounted() {
    this.fetchProjects();
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