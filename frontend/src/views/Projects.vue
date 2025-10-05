```vue
<template>
  <div class="container mt-5">
    <!-- Toast для уведомлений -->
    <div class="toast-container position-fixed top-0 end-0 p-3">
      <div
        id="notificationToast"
        class="toast"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-bs-autohide="true"
        data-bs-delay="3000"
      >
        <div class="toast-header" :class="toastType === 'success' ? 'bg-success text-white' : 'bg-danger text-white'">
          <strong class="me-auto">{{ toastType === 'success' ? 'Успех' : 'Ошибка' }}</strong>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
          {{ toastMessage }}
        </div>
      </div>
    </div>

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
          maxlength="100"
          required
        />
        <span v-if="projectName.length > 100" class="text-danger">Максимум 100 символов</span>
      </div>
      <div class="mb-3">
        <label for="projectDescription" class="form-label">Описание проекта</label>
        <textarea
          class="form-control"
          id="projectDescription"
          v-model.trim="projectDescription"
          placeholder="Введите описание проекта (опционально)"
          maxlength="500"
        ></textarea>
        <span v-if="projectDescription.length > 500" class="text-danger">Максимум 500 символов</span>
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
            maxlength="100"
            required
          />
          <span v-if="editProjectName.length > 100" class="text-danger">Максимум 100 символов</span>
        </div>
        <div class="mb-3">
          <label for="editProjectDescription" class="form-label">Описание проекта</label>
          <textarea
            class="form-control"
            id="editProjectDescription"
            v-model.trim="editProjectDescription"
            placeholder="Введите описание проекта (опционально)"
            maxlength="500"
          ></textarea>
          <span v-if="editProjectDescription.length > 500" class="text-danger">Максимум 500 символов</span>
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
            maxlength="500"
            required
          ></textarea>
          <span v-if="defectDescription.length > 500" class="text-danger">Максимум 500 символов</span>
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
              maxlength="500"
              required
            ></textarea>
            <span v-if="editDefectDescription.length > 500" class="text-danger">Максимум 500 символов</span>
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
import { Toast } from 'bootstrap';

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
      defects: [],
      toastMessage: '',
      toastType: 'success'
    };
  },
  methods: {
    showToast(message, type = 'success') {
      this.toastMessage = message;
      this.toastType = type;
      const toastElement = document.getElementById('notificationToast');
      const toast = new Toast(toastElement);
      toast.show();
    },
    async createProject() {
      if (this.projectName.length > 100 || (this.projectDescription && this.projectDescription.length > 500)) {
        this.showToast('Превышена максимальная длина полей', 'error');
        return;
      }
      try {
        const response = await axios.post('http://localhost:3000/api/projects', {
          name: this.projectName,
          description: this.projectDescription
        }, { withCredentials: true });
        this.showToast(`Проект создан: ${response.data.message}`, 'success');
        this.projectName = '';
        this.projectDescription = '';
        this.fetchProjects();
      } catch (error) {
        this.showToast(`Ошибка создания проекта: ${error.response?.data?.message || 'Ошибка сервера'}`, 'error');
      }
    },
    async fetchProjects() {
      try {
        const response = await axios.get('http://localhost:3000/api/projects', { withCredentials: true });
        this.projects = response.data.projects;
      } catch (error) {
        this.showToast(`Ошибка загрузки проектов: ${error.response?.data?.message || 'Ошибка сервера'}`, 'error');
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
      if (this.editProjectName.length > 100 || (this.editProjectDescription && this.editProjectDescription.length > 500)) {
        this.showToast('Превышена максимальная длина полей', 'error');
        return;
      }
      try {
        console.log('Редактирование проекта:', { id: this.editingProject.id, name: this.editProjectName, description: this.editProjectDescription });
        const response = await axios.put(`http://localhost:3000/api/projects/${this.editingProject.id}`, {
          name: this.editProjectName,
          description: this.editProjectDescription
        }, { withCredentials: true });
        this.showToast(`Проект обновлён: ${response.data.message}`, 'success');
        this.editingProject = null;
        this.editProjectName = '';
        this.editProjectDescription = '';
        this.fetchProjects();
      } catch (error) {
        console.error('Ошибка обновления проекта:', error.response?.data || error.message);
        this.showToast(`Ошибка обновления проекта: ${error.response?.data?.message || 'Ошибка сервера'}`, 'error');
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
        this.showToast(`Проект удалён: ${response.data.message}`, 'success');
        if (this.selectedProjectId === projectId) {
          this.selectedProjectId = null;
          this.defects = [];
        }
        this.fetchProjects();
      } catch (error) {
        this.showToast(`Ошибка удаления проекта: ${error.response?.data?.message || 'Ошибка сервера'}`, 'error');
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
      if (this.defectDescription.length > 500) {
        this.showToast('Превышена максимальная длина описания дефекта', 'error');
        return;
      }
      try {
        const response = await axios.post('http://localhost:3000/api/defects', {
          projectId: this.selectedProjectId,
          description: this.defectDescription,
          status: this.defectStatus
        }, { withCredentials: true });
        this.showToast(`Дефект создан: ${response.data.message}`, 'success');
        this.defectDescription = '';
        this.defectStatus = 'open';
        this.fetchDefects();
      } catch (error) {
        this.showToast(`Ошибка создания дефекта: ${error.response?.data?.message || 'Ошибка сервера'}`, 'error');
      }
    },
    async fetchDefects() {
      try {
        const response = await axios.get(`http://localhost:3000/api/defects?projectId=${this.selectedProjectId}`, {
          withCredentials: true
        });
        this.defects = response.data.defects;
      } catch (error) {
        this.showToast(`Ошибка загрузки дефектов: ${error.response?.data?.message || 'Ошибка сервера'}`, 'error');
      }
    },
    startEditDefect(defect) {
      console.log('Начало редактирования дефекта:', defect);
      this.editingDefect = defect;
      this.editDefectDescription = defect.description;
      this.editDefectStatus = defect.status;
    },
    async updateDefect() {
      if (this.editDefectDescription.length > 500) {
        this.showToast('Превышена максимальная длина описания дефекта', 'error');
        return;
      }
      try {
        console.log('Редактирование дефекта:', { id: this.editingDefect.id, description: this.editDefectDescription, status: this.editDefectStatus });
        const response = await axios.put(`http://localhost:3000/api/defects/${this.editingDefect.id}`, {
          description: this.editDefectDescription,
          status: this.editDefectStatus
        }, { withCredentials: true });
        this.showToast(`Дефект обновлён: ${response.data.message}`, 'success');
        this.editingDefect = null;
        this.editDefectDescription = '';
        this.editDefectStatus = 'open';
        this.fetchDefects();
      } catch (error) {
        console.error('Ошибка обновления дефекта:', error.response?.data || error.message);
        this.showToast(`Ошибка обновления дефекта: ${error.response?.data?.message || 'Ошибка сервера'}`, 'error');
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
        this.showToast(`Дефект удалён: ${response.data.message}`, 'success');
        this.fetchDefects();
      } catch (error) {
        this.showToast(`Ошибка удаления дефекта: ${error.response?.data?.message || 'Ошибка сервера'}`, 'error');
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
.text-danger {
  font-size: 0.9em;
}
</style>
```