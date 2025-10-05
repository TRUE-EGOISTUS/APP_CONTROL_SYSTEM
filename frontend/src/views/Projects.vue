```vue
<template>
  <div class="container mt-5">
    <h2>Проекты и дефекты</h2>

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
        <button type="submit" class="btn btn-success mb-4">Сохранить</button>
        <button type="button" class="btn btn-secondary mb-4 ms-2" @click="cancelEditProject">Отмена</button>
      </form>
    </div>

    <!-- Список проектов -->
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
              <button class="btn btn-sm btn-primary me-2" @click="selectProject(project.id)">Просмотреть дефекты</button>
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

    <!-- Форма создания дефекта -->
    <div v-if="selectedProjectId !== null">
      <h3>Добавить дефект для проекта #{{ selectedProjectId }}</h3>
      <form @submit.prevent="createDefect">
        <div class="mb-3">
          <label for="defectDescription" class="form-label">Описание дефекта</label>
          <textarea
            class="form-control"
            id="defectDescription"
            v-model.trim="defectDescription"
            placeholder="Введите описание дефекта"
            required
          ></textarea>
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

      <!-- Форма редактирования дефекта -->
      <div v-if="editingDefect">
        <h3>Редактировать дефект #{{ editingDefect.id }}</h3>
        <form @submit.prevent="updateDefect">
          <div class="mb-3">
            <label for="editDefectDescription" class="form-label">Описание дефекта</label>
            <textarea
              class="form-control"
              id="editDefectDescription"
              v-model.trim="editDefectDescription"
              placeholder="Введите описание дефекта"
              required
            ></textarea>
          </div>
          <div class="mb-3">
            <label for="editDefectStatus" class="form-label">Статус</label>
            <select
              class="form-control"
              id="editDefectStatus"
              v-model="editDefectStatus"
              required
            >
              <option value="open">Открыт</option>
              <option value="closed">Закрыт</option>
            </select>
          </div>
          <button type="submit" class="btn btn-success mb-4">Сохранить</button>
          <button type="button" class="btn btn-secondary mb-4 ms-2" @click="cancelEditDefect">Отмена</button>
        </form>
      </div>

      <!-- Список дефектов -->
      <h3>Дефекты проекта #{{ selectedProjectId }}</h3>
      <div v-if="defects.length > 0">
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Описание</th>
              <th>Статус</th>
              <th>Дата создания</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="defect in defects" :key="defect.id">
              <td>{{ defect.description }}</td>
              <td>{{ defect.status === 'open' ? 'Открыт' : 'Закрыт' }}</td>
              <td>{{ new Date(defect.createdAt).toLocaleDateString() }}</td>
              <td>
                <button class="btn btn-sm btn-warning me-2" @click="startEditDefect(defect)">Редактировать</button>
                <button class="btn btn-sm btn-danger" @click="deleteDefect(defect.id)">Удалить</button>
              </td>
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
      editProjectName: '',
      editProjectDescription: '',
      editingProject: null,
      selectedProjectId: null,
      defectDescription: '',
      defectStatus: 'open',
      editDefectDescription: '',
      editDefectStatus: 'open',
      editingDefect: null,
      projects: [],
      defects: []
    };
  },
  methods: {
    async createProject() {
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
    startEditProject(project) {
      console.log('Начало редактирования проекта:', project);
      this.editingProject = project;
      this.editProjectName = project.name;
      this.editProjectDescription = project.description || '';
    },
    async updateProject() {
      try {
        console.log('Редактирование проекта:', { id: this.editingProject.id, name: this.editProjectName, description: this.editProjectDescription });
        const response = await axios.put(`http://localhost:3000/api/projects/${this.editingProject.id}`, {
          name: this.editProjectName,
          description: this.editProjectDescription
        }, { withCredentials: true });
        alert(`Проект обновлён: ${response.data.message}`);
        this.editingProject = null;
        this.editProjectName = '';
        this.editProjectDescription = '';
        this.fetchProjects();
      } catch (error) {
        console.error('Ошибка обновления проекта:', error.response?.data || error.message);
        alert(`Ошибка обновления проекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    cancelEditProject() {
      this.editingProject = null;
      this.editProjectName = '';
      this.editProjectDescription = '';
    },
    async deleteProject(projectId) {
      if (!confirm('Вы уверены, что хотите удалить проект? Все связанные дефекты будут удалены.')) {
        return;
      }
      try {
        const response = await axios.delete(`http://localhost:3000/api/projects/${projectId}`, { withCredentials: true });
        alert(`Проект удалён: ${response.data.message}`);
        if (this.selectedProjectId === projectId) {
          this.selectedProjectId = null;
          this.defects = [];
        }
        this.fetchProjects();
      } catch (error) {
        alert(`Ошибка удаления проекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async selectProject(projectId) {
      this.selectedProjectId = projectId;
      this.defects = [];
      this.defectDescription = '';
      this.defectStatus = 'open';
      this.editingDefect = null;
      await this.fetchDefects();
    },
    async createDefect() {
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
    },
    startEditDefect(defect) {
      console.log('Начало редактирования дефекта:', defect);
      this.editingDefect = defect;
      this.editDefectDescription = defect.description;
      this.editDefectStatus = defect.status;
    },
    async updateDefect() {
      try {
        console.log('Редактирование дефекта:', { id: this.editingDefect.id, description: this.editDefectDescription, status: this.editDefectStatus });
        const response = await axios.put(`http://localhost:3000/api/defects/${this.editingDefect.id}`, {
          description: this.editDefectDescription,
          status: this.editDefectStatus
        }, { withCredentials: true });
        alert(`Дефект обновлён: ${response.data.message}`);
        this.editingDefect = null;
        this.editDefectDescription = '';
        this.editDefectStatus = 'open';
        this.fetchDefects();
      } catch (error) {
        console.error('Ошибка обновления дефекта:', error.response?.data || error.message);
        alert(`Ошибка обновления дефекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    cancelEditDefect() {
      this.editingDefect = null;
      this.editDefectDescription = '';
      this.editDefectStatus = 'open';
    },
    async deleteDefect(defectId) {
      if (!confirm('Вы уверены, что хотите удалить дефект?')) {
        return;
      }
      try {
        const response = await axios.delete(`http://localhost:3000/api/defects/${defectId}`, { withCredentials: true });
        alert(`Дефект удалён: ${response.data.message}`);
        this.fetchDefects();
      } catch (error) {
        alert(`Ошибка удаления дефекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
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
```